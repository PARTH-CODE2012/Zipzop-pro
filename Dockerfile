# Builder stage: install deps and build client
FROM node:18-bullseye AS builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app

# Server deps
COPY package.json package-lock.json* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then \
    npm ci --silent --no-audit --no-fund || npm install --silent --no-audit --no-fund; \
  else \
    npm install --silent --no-audit --no-fund; \
  fi

# Client deps (install dev deps so vite is available)
COPY client/package.json client/package-lock.json* ./client/
RUN set -eux; \
  cd client; \
  if [ -f package-lock.json ]; then \
    npm_config_production=false npm ci --silent --no-audit --no-fund || npm_config_production=false npm install --silent --no-audit --no-fund; \
  else \
    npm_config_production=false npm install --silent --no-audit --no-fund; \
  fi

# Copy source and build client
COPY . .
RUN cd client && npm run build

# Runtime image
FROM node:18-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Default PORT inside container (used when process.env.PORT is not provided)
ENV PORT=10000

# Install runtime packages (ffmpeg + fonts)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# Copy app and built client
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/client/dist ./client/dist

# Ensure non-root
RUN chown -R node:node /app
USER node

# Expose the internal port
EXPOSE 10000

CMD ["node", "src/index.js"]
