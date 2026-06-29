import express from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../auth.js';
import { TMP_UPLOAD_DIR, PROCESSED_DIR } from './videos.js';
import kinetic from '../kinetic-caption.js';
import { generatePreviewWithASS } from '../ffmpeg-service.js';
import { query } from '../db.js';

const router = express.Router();

// Create kinetic captions (generate ASS). body: { filename, captions, preset, style, burn (optional) }
router.post('/kinetic/create', requireAuth, async (req, res) => {
  try {
    const { filename, captions, preset, style, burn } = req.body;
    if (!filename || !Array.isArray(captions)) return res.status(400).json({ error: 'filename and captions[] required' });
    const videoPath = path.join(TMP_UPLOAD_DIR, filename);
    if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video not found' });

    const base = path.parse(filename).name;
    const assName = `${base}-kinetic-${Date.now()}.ass`;
    const assPath = path.join(PROCESSED_DIR, assName);

    const assText = kinetic.buildASS(captions, style || {}, preset || 'slide-in');
    kinetic.writeASSFile(assText, assPath);

    // store in DB
    const dbRes = await query(
      'INSERT INTO captions (user_id, filename, ass_path, preset, style) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.id, filename, `/processed/${assName}`, preset || null, style || null]
    );
    const capId = dbRes.rows[0].id;

    // Optionally burn ASS into full video and return output link (expensive)
    if (burn) {
      const outName = `${base}-kinetic-burn-${Date.now()}${path.extname(filename)}`;
      const outPath = path.join(PROCESSED_DIR, outName);
      await generatePreviewWithASS(videoPath, assPath, 0, null, outPath);
      return res.json({ ok: true, id: capId, ass: `/processed/${assName}`, out: `/processed/${outName}` });
    }

    res.json({ ok: true, id: capId, ass: `/processed/${assName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Preview kinetic captions: body { filename, captions, preset, style, start, duration }
router.post('/kinetic/preview', requireAuth, async (req, res) => {
  try {
    const { filename, captions, preset, style, start = 0, duration = 8 } = req.body;
    if (!filename || !Array.isArray(captions)) return res.status(400).json({ error: 'filename and captions[] required' });
    const videoPath = path.join(TMP_UPLOAD_DIR, filename);
    if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video not found' });

    const base = path.parse(filename).name;
    const assName = `${base}-preview-${Date.now()}.ass`;
    const assPath = path.join(PROCESSED_DIR, assName);
    const assText = kinetic.buildASS(captions, style || {}, preset || 'slide-in');
    kinetic.writeASSFile(assText, assPath);

    const outName = `${base}-preview-${Date.now()}.mp4`;
    const outPath = path.join(PROCESSED_DIR, outName);

    await generatePreviewWithASS(videoPath, assPath, Number(start), Number(duration), outPath);

    res.json({ ok: true, preview: `/processed/${outName}`, ass: `/processed/${assName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch caption metadata
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await query('SELECT id, user_id, filename, ass_path, srt_path, preset, style, created_at FROM captions WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Caption not found' });
    res.json({ ok: true, caption: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download ASS vs SRT
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fmt = (req.query.format || 'ass').toLowerCase();
    const r = await query('SELECT ass_path, srt_path FROM captions WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Caption not found' });
    const row = r.rows[0];
    if (fmt === 'ass') {
      const p = path.join(process.cwd(), row.ass_path.replace(/^\/+/,''));
      if (!fs.existsSync(p)) return res.status(404).json({ error: 'ASS file not found' });
      return res.download(p);
    } else if (fmt === 'srt' && row.srt_path) {
      const p = path.join(process.cwd(), row.srt_path.replace(/^\/+/,''));
      if (!fs.existsSync(p)) return res.status(404).json({ error: 'SRT file not found' });
      return res.download(p);
    }
    res.status(400).json({ error: 'Unsupported format or file missing' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
