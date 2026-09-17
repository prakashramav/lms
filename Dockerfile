# syntax=docker/dockerfile:1
# Multi-stage production Dockerfile for LMS Backend API
# Phase 13 — Production Engineering & Security Hardening

# 1. Base stage with minimal Alpine Node image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# 2. Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --omit=dev --ignore-scripts

# 3. Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 edtechuser

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and code from dependencies and workspace
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
COPY package.json ./

# Ensure uploads directory exists and is owned by non-root user
RUN mkdir -p /app/apps/backend/uploads && \
    chown -R edtechuser:nodejs /app

USER edtechuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "apps/backend/src/server.js"]
