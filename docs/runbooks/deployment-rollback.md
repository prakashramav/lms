# Incident Runbook: Deployment Rollback

## Objective
Quickly revert a failed production release to the previous stable release with zero data loss.

---

## Rollback Procedure

### 1. Identify Target Stable Commit / Tag
Locate the previous stable release tag:
```bash
git tag -l "v*" --sort=-creatordate | head -n 5
# e.g., target: v1.0.0 or commit hash
```

### 2. Frontend Rollback (Vercel / Next.js)
1. Navigate to Vercel / Cloudflare Pages dashboard.
2. Select previous successful deployment and click **Promote to Production**.
3. Traffic transitions instantly via edge CDN routing.

### 3. Backend API Rollback (Docker / Kubernetes)
1. Using Docker Compose:
   ```bash
   docker compose pull backend:<previous-tag>
   docker compose up -d backend
   ```
2. Using Kubernetes:
   ```bash
   kubectl rollout undo deployment/edtech-backend -n production
   kubectl rollout status deployment/edtech-backend -n production
   ```

### 4. Database Compatibility Check
- Migrations are designed to be additive and backward-compatible (non-destructive).
- Previous backend builds remain compatible with new schema fields without rolling back MongoDB data.

### 5. Verification
Verify service probes:
```bash
curl -i https://api.yourdomain.com/health
curl -i https://api.yourdomain.com/ready
```
Ensure HTTP 200 response.
