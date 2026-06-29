// src/routes/videos.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../auth.js';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

const router = express.Router();

const TMP_UPLOAD_DIR = process.env.TMP_DIR || path.join(process.cwd(), 'tmp', 'uploads');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(process.cwd(), 'processed');

function initStorageFolders() {
  [TMP_UPLOAD_DIR, PROCESSED_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}
initStorageFolders();

// Configure Redis connection for Queue only if present
let queue = null;
const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
if (redisUrl) {
  try {
    const connection = new IORedis(redisUrl, { retryStrategy: (times) => Math.min(2000, 50 * times), maxRetriesPerRequest: null });
    connection.on('error', (err) => console.error('[ioredis] videos route error', err && err.message ? err.message : err));
    queue = new Queue('video-processing', { connection });
    console.log('Video queue created');
  } catch (err) {
    console.warn('Failed to create video queue, background jobs disabled:', err && err.message ? err.message : err);
    queue = null;
  }
} else {
  console.warn('REDIS not configured — background jobs disabled.');
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, uuidv4() + (path.extname(file.originalname) || ''))
});
const upload = multer({ storage });

// Upload endpoint
router.post('/upload', requireAuth, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ ok: true, filename: req.file.filename, originalname: req.file.originalname, path: req.file.path });
});

// Enqueue processing job
router.post('/jobs', requireAuth, async (req, res) => {
  try {
    if (!queue) return res.status(503).json({ error: 'Background processing unavailable (Redis not configured).' });
    const { filename, operations } = req.body;
    if (!filename || !Array.isArray(operations)) return res.status(400).json({ error: 'filename and operations[] required' });

    const jobId = uuidv4();
    const filePath = path.join(TMP_UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Uploaded file not found' });

    const job = await queue.add('process', { jobId, filename, operations, userId: req.user.id }, { removeOnComplete: 1000, removeOnFail: 1000 });
    res.json({ ok: true, jobId: job.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Job status
router.get('/jobs/:id', requireAuth, async (req, res) => {
  try {
    if (!queue) return res.status(503).json({ error: 'Background processing unavailable (Redis not configured).' });
    const job = await queue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const state = await job.getState();
    const progress = job.progress || 0;
    const returnvalue = job.returnvalue || null;
    res.json({ ok: true, id: job.id, name: job.name, state, progress, returnvalue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
export { initStorageFolders, TMP_UPLOAD_DIR, PROCESSED_DIR, queue as getQueueInstance };
