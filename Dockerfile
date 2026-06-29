# Builder stage: install deps and build client
FROM node:18-alpine AS builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app

# Copy root package manifests and install root deps (ci if lockfile exists)
COPY package.json package-lock.json* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then \
    npm ci --silent --no-audit --no-fund || npm install --silent --no-audit --no-fund; \
  else \
    npm install --silent --no-audit --no-fund; \
  fi

# Copy client package manifests and install client deps
COPY client/package.json client/package-lock.json* ./client/
RUN set -eux; \
  if [ -f client/package-lock.json ]; then \
    (cd client && npm ci --silent --no-audit --no-fund) || (cd client && npm install --silent --no-audit --no-fund); \
  else \
    (cd client && npm install --silent --no-audit --no-fund); \
  fi

# Copy rest of repo and build client
COPY . .
RUN cd client && npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
# Set the runtime port (match EXPOSE below)
ENV PORT=10000

# Install ffmpeg and fonts (alpine packages)
RUN apk add --no-cache ffmpeg ttf-dejavu ca-certificates

# Copy node_modules and app sources from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Use non-root node user
USER node

EXPOSE 10000

CMD ["node", "src/index.js"]
