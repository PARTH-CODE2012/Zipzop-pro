// src/worker.js
import path from 'path';
import fs from 'fs';
import * as ff from './ffmpeg-service.js';
import { query } from './db.js';
import kinetic from './kinetic-caption.js';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';

function createWorkerConnection() {
  const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
  if (!redisUrl) {
    console.warn('REDIS not configured: Worker will not start.');
    return null;
  }
  const conn = new IORedis(redisUrl, { retryStrategy: (times) => Math.min(2000, 50 * times), maxRetriesPerRequest: null });
  conn.on('error', (err) => console.error('[ioredis] worker error', err && err.message ? err.message : err));
  conn.on('connect', () => console.log('Worker: redis connected'));
  conn.on('ready', () => console.log('Worker: redis ready'));
  return conn;
}

const connection = createWorkerConnection();

if (!connection) {
  console.warn('Background worker disabled because Redis is not configured.');
  process.exit(0); // optional: stop worker container if you run worker separately; remove if worker should stay running without queue
}

/*
  If you keep worker process running even without redis, comment out process.exit(0) above
  and skip creating Worker. Below is the normal worker logic when Redis is available.
*/

import { TMP_UPLOAD_DIR, PROCESSED_DIR } from './routes/videos.js';
import { Worker as BullWorker } from 'bullmq';

function makeOutName(base, suffix, ext) {
  return `${base}-${suffix}-${Date.now()}${ext}`;
}

const worker = new BullWorker('video-processing', async (job) => {
  const data = job.data;
  const filename = data.filename;
  const operations = data.operations || [];
  const inPath = path.join(TMP_UPLOAD_DIR, filename);
  if (!fs.existsSync(inPath)) throw new Error('Input file not found: ' + inPath);

  let currentPath = inPath;
  let lastOut = null;

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const pctBase = Math.floor((i / operations.length) * 100);
    const pctRange = Math.floor(100 / operations.length);

    if (op.op === 'trim') {
      const outName = makeOutName(path.parse(filename).name, 'trim', path.extname(filename));
      const outPath = path.join(PROCESSED_DIR, outName);
      await ff.trimVideo(currentPath, Number(op.start), Number(op.duration), outPath, Boolean(op.reencode), (p) => {
        const percent = Math.min(100, pctBase + Math.floor((p.percent || 0) * (pctRange / 100)));
        job.updateProgress({ step: 'trim', percent, details: p });
      });
      currentPath = outPath; lastOut = outPath;
    } else if (op.op === 'color') {
      const outName = makeOutName(path.parse(filename).name, `grade-${op.preset || 'vibrant'}`, path.extname(filename));
      const outPath = path.join(PROCESSED_DIR, outName);
      await ff.applyColorGrade(currentPath, op.preset || 'vibrant', outPath, (p) => {
        const percent = Math.min(100, pctBase + Math.floor((p.percent || 0) * (pctRange / 100)));
        job.updateProgress({ step: 'color', percent, details: p });
      });
      currentPath = outPath; lastOut = outPath;
    } else if (op.op === 'auto_caption') {
      const audioTemp = path.join(TMP_UPLOAD_DIR, `${path.parse(filename).name}-${Date.now()}.m4a`);
      await ff.extractAudioToM4A(currentPath, audioTemp, () => {});
      const outName = makeOutName(path.parse(filename).name, 'auto', '.srt');
      const outPath = path.join(PROCESSED_DIR, outName);
      await ff.transcribeWithOpenAI(audioTemp, outPath);
      try { fs.unlinkSync(audioTemp); } catch (e) {}
      job.updateProgress({ step: 'auto_caption', percent: pctBase + pctRange, subtitle: `/processed/${outName}` });
    } else if (op.op === 'kinetic_caption') {
      const caps = op.captions;
      const preset = op.preset || 'slide-in';
      const style = op.style || {};
      if (!Array.isArray(caps)) throw new Error('kinetic_caption requires captions array');

      const assText = kinetic.buildASS(caps, style, preset);
      const assName = makeOutName(path.parse(filename).name, `kinetic-${preset}`, '.ass');
      const assPath = path.join(PROCESSED_DIR, assName);
      fs.writeFileSync(assPath, assText, 'utf8');

      try {
        await query('INSERT INTO captions (user_id, filename, ass_path, preset, style) VALUES ($1,$2,$3,$4,$5)', [data.userId || null, filename, `/processed/${assName}`, preset, style]);
      } catch (dbErr) {
        console.warn('Failed to write caption metadata', dbErr.message);
      }

      job.updateProgress({ step: 'kinetic', percent: pctBase + pctRange, ass: `/processed/${assName}` });

      if (op.burn) {
        const outName = makeOutName(path.parse(filename).name, `kinetic-burn-${preset}`, path.extname(filename));
        const outPath = path.join(PROCESSED_DIR, outName);
        await ff.burnASS(currentPath, assPath, outPath, () => {});
        currentPath = outPath; lastOut = outPath;
      }
    } else if (op.op === 'burn') {
      const srtFilename = op.srtFilename;
      const srtPath = path.join(PROCESSED_DIR, srtFilename || '');
      if (!fs.existsSync(srtPath)) throw new Error('SRT not found: ' + srtPath);
      const outName = makeOutName(path.parse(filename).name, 'burned', path.extname(filename));
      const outPath = path.join(PROCESSED_DIR, outName);
      await ff.burnSubtitles(currentPath, srtPath, outPath, () => {});
      currentPath = outPath; lastOut = outPath;
    } else {
      console.warn('Unknown op', op);
    }
  }

  return { out: lastOut ? `/processed/${path.basename(lastOut)}` : null };
}, { connection });

worker.on('completed', (job) => { console.log('Job completed', job.id); });
worker.on('failed', (job, err) => { console.error('Job failed', job.id, err); });
