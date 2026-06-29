import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import { QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

dotenv.config();

import authRoutes from './routes/auth.js';
import videosRoutes, { initStorageFolders } from './routes/videos.js';
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

// Run DB migrations on startup (best-effort)
runMigrations().catch((err) => {
  console.warn('DB migrations failed to run on startup:', err.message);
});

// Ensure local folders exist
initStorageFolders();

app.use('/api', authRoutes);
app.use('/api', videosRoutes);
app.use('/api/captions', captionsRoutes);
app.use('/api/premium', premiumRoutes);

// Serve processed files
app.use('/processed', express.static(path.join(process.cwd(), 'processed')));
app.use('/tmp', express.static(path.join(process.cwd(), 'tmp')));

// Socket.IO + BullMQ QueueEvents to forward job events to clients
import { Server as IOServer } from 'socket.io';
const io = new IOServer(server, {
  cors: { origin: '*' }
});

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379
});
const queueEvents = new QueueEvents('video-processing', { connection });

queueEvents.on('progress', ({ jobId, data }) => {
  io.emit('job:progress', { jobId, data });
});
queueEvents.on('completed', ({ jobId, returnvalue }) => {
  io.emit('job:completed', { jobId, returnvalue });
});
queueEvents.on('failed', ({ jobId, failedReason }) => {
  io.emit('job:failed', { jobId, failedReason });
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('hello', (msg) => {
    console.log('client hello', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ZipZop Pro Studio server listening on http://localhost:${PORT}`);
});
import path from 'path';
import fs from 'fs';

// Serve client build (Vite production build) if present
const clientDist = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // If using SPA routing, fallback to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
