# ============================================================
# Backend API - Fastify + Drizzle + PostgreSQL
# Multi-stage build para imagem final enxuta
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache curl tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S hsfa -u 1001

COPY --from=builder --chown=hsfa:nodejs /app/package.json ./package.json
COPY --from=builder --chown=hsfa:nodejs /app/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder --chown=hsfa:nodejs /app/dist ./dist

USER hsfa

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:3001/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
