# Backend API Gateway Deployment Guide

## 1. Overview
The REST API backend (`apps/backend`) runs on Node.js/Express with MongoDB, Redis, AI Router, and background workers.

## 2. Production Startup & Process Management
```bash
# Production process startup
npm run start --workspace=apps/backend
```

## 3. Health & Supervision Probes
- **Liveness Probe**: `GET /live` (Returns process uptime)
- **Readiness Probe**: `GET /ready` (Verifies MongoDB and backing datastores)
- **Health Check**: `GET /health` (Standard health response)
- **Observability Metrics**: `GET /metrics` (Exposes latency percentiles, error rates, queue depths)
