# Background Workers & Queue Deployment Guide

## 1. Overview
Heavy computational workloads (report generation, batch recommendation recalculations, certificate generation) run asynchronously through the background job queue.

## 2. Queue Configuration
- In-memory execution with bounded retries (3 attempts), exponential backoff, and Dead Letter Queue (DLQ).
- Redis-backed queue driver can be enabled via `REDIS_URL`.

## 3. Operational Supervision
- Admin queue endpoint: `GET /api/v1/queue/status`
- Dead Letter Queue retry: `POST /api/v1/queue/dlq/:jobId/retry`
- Job cancellation: `POST /api/v1/queue/jobs/:jobId/cancel`
