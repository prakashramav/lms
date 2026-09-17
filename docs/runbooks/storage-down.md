# Incident Runbook: Object Storage Outage (Cloudinary / S3)

## Severity: P2 (Major)

### Symptoms
- Avatar uploads, resume PDF uploads, or course thumbnail attachments fail with `500` or timeout.
- Storage service reports network connectivity failure.

---

### Triage & Diagnostics
1. Test storage credentials and reachability:
   - Check Cloudinary API status.
   - Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_CLOUD_NAME`.
2. Check local disk fallback space in `/uploads`.

---

### Mitigation
1. Enable local filesystem storage fallback if configured in `apps/backend/src/config/storage.js`.
2. Existing uploaded assets served through CDN caches continue to render.
3. Queue upload retries in background job worker.
