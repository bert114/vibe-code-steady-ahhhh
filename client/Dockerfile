# Production image for Steady-Ahh client (Vite React SPA → nginx)
# Built from repo root so npm ci can use the single root lockfile.
# Multi-stage: build → nginx runtime.

# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install ALL deps (including dev for build)
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --workspace=client --no-audit --no-fund

# Copy client source and build
COPY client/ ./client/
RUN npm run build --workspace=client

# ---- Runtime stage ----
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx config (SPA rewrite + API proxy)
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]