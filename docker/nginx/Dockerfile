# ============================================================
# Frontend React + nginx
# Build do Vite e serve estáticos + reverse proxy para /api
# ============================================================

# ---------- Stage 1: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache curl

# Remove config default
RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx/nginx.conf /etc/nginx/conf.d/app.conf
COPY docker/nginx/security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copia build do Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
