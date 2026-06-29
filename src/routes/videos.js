import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../auth.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const router = express.Router();

const TMP_UPLOAD_DIR = process.env.TMP_DIR || path.join(process.cwd(), 'tmp', 'uploads');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(process.cwd(), 'processed');

function initStorageFolders() {
  [TMP_UPLOAD_DIR, PROCESSED_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}
initStorageFolders();

// Multer storage (no fileSize limits)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage });

// BullMQ queue setup
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379
});
const queue = new Queue('video-processing', { connection });

// Upload endpoint
router.post('/upload', requireAuth, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    ok: true,
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: req.file.path
  });
});

// Enqueue processing job
// Body: { filename, operations: [ { op: 'trim', start, duration, reencode }, { op: 'color', preset }, { op: 'auto_caption' } ] }
router.post('/jobs', requireAuth, async (req, res) => {
  try {
    const { filename, operations } = req.body;
    if (!filename || !Array.isArray(operations)) return res.status(400).json({ error: 'filename and operations[] required' });

    const jobId = uuidv4();
    const filePath = path.join(TMP_UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Uploaded file not found' });

    const job = await queue.add('process', {
      jobId,
      filename,
      operations,
      userId: req.user.id
    }, {
      removeOnComplete: 1000,
      removeOnFail: 1000
    });

    res.json({ ok: true, jobId: job.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Job status
router.get('/jobs/:id', requireAuth, async (req, res) => {
  try {
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
export { initStorageFolders, TMP_UPLOAD_DIR, PROCESSED_DIR };
