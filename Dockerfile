# syntax=docker/dockerfile:1
# Multi-stage, non-root production image using Next.js standalone output.
# Node version is pinned to an LTS digest tag via build arg.
ARG NODE_VERSION=22.14.0-bookworm-slim

# ---------------------------------------------------------------------------
# Stage 1 — install dependencies (with build toolchain for native modules)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  else npm install --no-audit --no-fund; fi

# ---------------------------------------------------------------------------
# Stage 2 — build the standalone server (includes `prisma generate`)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Next.js evaluates server modules while collecting route data. These build-only
# placeholders satisfy validation; Compose injects all real runtime credentials.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV S3_ENDPOINT=http://127.0.0.1:9000
ENV S3_BUCKET=build
ENV S3_ACCESS_KEY_ID=build
ENV S3_SECRET_ACCESS_KEY=build
RUN mkdir -p public && npm run build

# ---------------------------------------------------------------------------
# Stage 3 — one-shot database migrator used by Compose before app startup
# ---------------------------------------------------------------------------
FROM builder AS migrator
CMD ["npm", "run", "prisma:deploy"]

# ---------------------------------------------------------------------------
# Stage 4 — minimal non-root runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl wget \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
