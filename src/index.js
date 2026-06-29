// src/index.js
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import IORedis from 'ioredis';
import { QueueEvents } from 'bullmq';

dotenv.config();

import authRoutes from './routes/auth.js';
import videosRoutes, { initStorageFolders, getQueueInstance } from './routes/videos.js';
import { runMigrations } from './db.js';
import captionsRoutes from './routes/captions.js';
import premiumRoutes from './routes/premium.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Health
app.get('/health', (req, res) => res.status(200).send('OK'));

// Run DB migrations (best-effort)
runMigrations().catch((err) => {
  console.warn('DB migrations failed to run on startup:', err && err.message ? err.message : err);
});

// Ensure storage directories exist
initStorageFolders();

// API routes
app.use('/api', authRoutes);
app.use('/api', videosRoutes);
app.use('/api/captions', captionsRoutes);
app.use('/api/premium', premiumRoutes);

// Serve processed/tmp
app.use('/processed', express.static(path.join(process.cwd(), 'processed')));
app.use('/tmp', express.static(path.join(process.cwd(), 'tmp')));

// Serve client build if present
const clientDist = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) {
  console.log(`Client dist found at ${clientDist} — serving static assets`);
  app.use(express.static(clientDist));
  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/processed') || req.path.startsWith('/tmp')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => { if (err) next(err); });
  });
} else {
  console.warn(`Client dist missing at ${clientDist} — root will show a helpful message.`);
  app.get('/', (req, res) => {
    res.type('text').send('API server running. Frontend not built or not found on server.');
  });
}

// Debug endpoint to inspect client/dist (temporary)
app.get('/_debug_client', (req, res) => {
  try {
    if (!fs.existsSync(clientDist)) return res.json({ ok: false, message: 'client/dist not found', clientDist });
    const list = fs.readdirSync(clientDist);
    return res.json({ ok: true, clientDist, files: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Safe Redis connection logic for QueueEvents (non-fatal if Redis unavailable)
 */
function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
  if (!redisUrl) {
    console.warn('REDIS not configured (REDIS_URL or REDIS_HOST missing). QueueEvents disabled.');
    return null;
  }

  const opts = {
    retryStrategy: (times) => Math.min(2000, 50 * times),
    maxRetriesPerRequest: null,
  };

  const client = new IORedis(redisUrl, opts);
  client.on('connect', () => console.log('Redis: connected'));
  client.on('ready', () => console.log('Redis: ready'));
  client.on('error', (err) => console.error('[ioredis] error', err && err.message ? err.message : err));
  client.on('end', () => console.warn('Redis: connection closed'));

  return client;
}

const redisConnection = createRedisConnection();

if (redisConnection) {
  // create QueueEvents to emit job updates to clients via socket.io
  const queueEvents = new QueueEvents('video-processing', { connection: redisConnection });
  queueEvents.on('progress', ({ jobId, data }) => io.emit('job:progress', { jobId, data }));
  queueEvents.on('completed', ({ jobId, returnvalue }) => io.emit('job:completed', { jobId, returnvalue }));
  queueEvents.on('failed', ({ jobId, failedReason }) => io.emit('job:failed', { jobId, failedReason }));
} else {
  console.warn('QueueEvents NOT created because Redis connection is not available.');
}

// Socket.IO setup
import { Server as IOServer } from 'socket.io';
const io = new IOServer(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('hello', (msg) => console.log('client hello', msg));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`NODE_ENV=${process.env.NODE_ENV}`);
});
