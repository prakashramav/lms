# Operational Troubleshooting & Diagnostics Guide

This document provides immediate diagnostic steps and remediation procedures for common operational issues encountered during local development, staging, and production.

---

## 1. MongoDB Connection Issues

### Symptom:
`[MongoDB Warning] Could not connect to MongoDB at ...` or `MongoServerSelectionError`

### Causes & Diagnosis:
- Local MongoDB daemon not running on port 27017.
- Incorrect credentials or connection string formatting in `MONGODB_URI`.
- In production, firewall or network security group blocking port 27017.

### Resolution:
1. Verify MongoDB daemon is active:
   ```bash
   mongosh --eval "db.adminCommand('ping')"
   # Or using Docker:
   docker compose ps mongodb
   ```
2. For production Atlas connections, verify IP access list allows outgoing traffic from your server or ECS task IPs.
3. In development, the platform automatically degrades gracefully, running in-memory or mock fallbacks for non-fatal workflows.

---

## 2. Missing Environment Variables at Startup

### Symptom:
`[Startup Error] Missing required production environment variable(s): MONGODB_URI, JWT_SECRET...`

### Causes & Diagnosis:
- In production mode (`NODE_ENV=production`), the backend strictly verifies required variables before binding ports to prevent insecure execution.

### Resolution:
1. Ensure the production environment has configured:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
2. Never hardcode secrets in `.env` files committed to Git. Inject them securely through your deployment orchestrator (AWS Secrets Manager, Kubernetes Secrets, or Doppler).

---

## 3. CORS Rejection on Cross-Origin API Requests

### Symptom:
Browser console displays: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`.

### Causes & Diagnosis:
- The frontend domain is not listed in `CORS_ORIGIN`.
- Wildcard `*` cannot be used when cookies/credentials (`credentials: 'include'`) are enabled.

### Resolution:
1. Update `CORS_ORIGIN` in the backend environment to include the exact frontend domain:
   ```env
   CORS_ORIGIN=https://student.yourdomain.com,https://instructor.yourdomain.com,https://admin.yourdomain.com
   ```
2. Verify protocol (HTTPS vs HTTP) and port match exactly.

---

## 4. Rate Limiting (HTTP 429 Too Many Requests)

### Symptom:
API returns `429 Too Many Requests` with `errorCode: 'RATE_LIMITED'`.

### Causes & Diagnosis:
- Burst of requests from a single IP or user account exceeding configured route limits:
  - Auth: 10 requests / 15 min
  - AI Tutor: 30 requests / 1 min
  - Code Execution: 20 executions / 1 min

### Resolution:
1. Wait until the window expires or configure higher limits in staging via `apps/backend/src/config/rateLimit.js`.
2. Ensure reverse proxy passes the true client IP via `X-Forwarded-For` with `trust proxy` enabled.

---

## 5. File Upload Failures

### Symptom:
File upload fails with `400 Bad Request` or `FILE_TOO_LARGE`.

### Causes & Diagnosis:
- Upload size exceeds `5MB`.
- Disallowed MIME type (only PDF for resumes; JPEG, PNG, WEBP for avatars and project media).

### Resolution:
1. Confirm the uploaded file matches permitted MIME formats and is under 5MB.
2. In production, check Cloudinary configuration credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
