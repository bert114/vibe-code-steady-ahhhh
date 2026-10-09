# Production image for Steady-Ahh server (Express API)
# Built from repo root so npm ci can use the single root lockfile.
# Multi-stage: build → node runtime.

# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps (production only)
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --workspace=server --omit=dev --no-audit --no-fund

# Copy server source
COPY server/ ./server/

# ---- Runtime stage ----
FROM node:22-alpine

WORKDIR /app

# Copy root package.json for npm workspace support
COPY --from=builder /app/package.json /app/package-lock.json ./

# Copy production node_modules and server code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=server"]