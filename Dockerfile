# Stage: builder
FROM node:18-bullseye AS builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Ensure a sane npm default (no audit/fund output)
# Try `npm ci` when a lockfile exists; otherwise fall back to `npm install`.
# The `||` fallback ensures the build proceeds if npm ci fails due to missing/invalid lockfile.
RUN set -eux; \
    if [ -f package-lock.json ]; then \
      echo "package-lock.json detected — running npm ci"; \
      npm ci --silent --no-audit --no-fund || (echo "npm ci failed, falling back to npm install" && npm install --silent --no-audit --no-fund); \
    else \
      echo "No package-lock.json — running npm install"; \
      npm install --silent --no-audit --no-fund; \
    fi

# Copy source (after deps) so changes to code don't bust dependency cache
COPY . .

# Optional: build step if you have a build script (uncomment if needed)
# RUN if [ "$NODE_ENV" != "development" ]; then npm run build --if-present; fi

# Stage: runtime
FROM node:18-bullseye-slim

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PATH=/app/node_modules/.bin:$PATH

# Install ffmpeg and fonts required for ASS rendering (no recommended packages)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create app directory and drop privileges
WORKDIR /app
# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy the app source
COPY --from=builder /app ./

# Ensure non-root user (use node user from official image)
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Healthcheck (optional; adjust endpoint as applicable)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD [ "sh", "-c", "if [ \"$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health 2>/dev/null)\" = '200' ]; then exit 0; else exit 1; fi" ]

CMD ["node", "src/index.js"]
