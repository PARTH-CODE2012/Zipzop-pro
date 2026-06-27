ZipZop Pro Studio — production-ready stack + Kinetic Caption Engine (prototype)
-------------------------------------------------------------------------------

This update includes:
- Postgres-backed auth and JWT tokens.
- Background processing with BullMQ & Redis and a Worker for FFmpeg tasks.
- Kinetic Caption Engine (ASS generation, preview, burn).
- Demo Premium system (upgrade endpoint — demo only, no payment provider).
- Client (Vite + React) with a simple editor to preview and generate kinetic captions.
- Dockerfile + docker-compose.yml (images include ffmpeg and fonts).

Quick start (local):
1) Copy .env.example to .env and set JWT_SECRET and DB/Redis values.
2) npm install
3) cd client && npm install
4) mkdir -p data/tmp data/processed
5) docker-compose up --build

Notes:
- Replace demo premium flow with a proper payments integration (Stripe) for production.
- Use S3 or persistent storage for uploads & processed files in production.# Zipzop-pro
