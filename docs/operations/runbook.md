# Comprehensive Operational Runbook

## 1. Overview
This operational runbook provides actionable step-by-step procedures for on-call site reliability engineers and platform administrators managing ApexLearn in production.

---

## 2. Table of Runbook Procedures

| Procedure ID | Operational Scenario | Primary Impact Tier |
| :--- | :--- | :--- |
| **SOP-01** | Production Application Deployment | Planned Maintenance / Zero-Downtime |
| **SOP-02** | Emergency Production Rollback | Sev-1 / Critical Regressions |
| **SOP-03** | Primary Database Outage / Failover | Sev-1 / Data Tier Disruption |
| **SOP-04** | Redis Cache & Queue Disruption | Sev-2 / Rate Limiting & Queue Delay |
| **SOP-05** | AI Provider Outage & Degraded Mode | Sev-3 / Copilot & Socratic Degradation |
| **SOP-06** | Object Storage Provider Disruption | Sev-2 / Media & Certificate Download |
| **SOP-07** | Email Delivery Provider Failure | Sev-3 / Async Notifications Delayed |
| **SOP-08** | Queue Backlog & Dead Letter Handling | Sev-2 / Worker Backpressure |
| **SOP-09** | Security Incident & Credential Revocation| Sev-1 / Security Threat Containment |

---

## 3. Standard Operating Procedures (SOPs)

### SOP-01: Production Application Deployment
1. Verify PR has passed CI/CD pipeline and has required approvals.
2. Confirm staging smoke tests passed: `curl -fsS https://staging-api.example.com/health`.
3. Execute blue-green rollout via CI/CD production deploy job.
4. Validate `/ready` and `/live` endpoints return `200 OK` on newly provisioned containers.
5. Invalidate Edge CDN cache for static bundles:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CF_TOKEN}" \
     --data '{"purge_everything":true}'
   ```
6. Monitor Grafana dashboard for 15 minutes post-deployment.

### SOP-02: Emergency Production Rollback
1. Incident Commander declares rollback.
2. Direct load balancer traffic back to the previous stable container image tag.
3. Revert frontend deployment via Vercel/Cloudflare rollback command.
4. Purge edge CDN cache immediately.
5. Verify `/health` and `/ready` probes return `200 OK`.
6. File postmortem ticket within 24 hours.

### SOP-03: Primary Database Outage / Failover
1. Check `/ready` probe. If returning 503, verify MongoDB cluster status.
2. Check MongoDB replica set status:
   ```javascript
   rs.status()
   ```
3. If primary is unresponsive, ensure election occurs automatically. If stalled, step down stalled node:
   ```javascript
   rs.stepDown(60)
   ```
4. Verify backend pool reconnects transparently via retryable writes (`retryWrites=true`).

### SOP-04: Redis Cache & Queue Disruption
1. If Redis is unreachable, the backend rate limiter gracefully falls back to in-memory window tracking.
2. Restart Redis cluster node:
   ```bash
   docker restart edtech-redis
   # or systemctl restart redis-server
   ```
3. Verify connection via `redis-cli ping`.
4. Flush volatile caches if corrupted: `redis-cli flushdb async`.

### SOP-05: AI Provider Outage & Degraded Mode
1. The resilient AI Router (`src/services/ai/aiRouter.js`) automatically trips after 3 consecutive failures.
2. In degraded mode, the platform routes prompts to deterministic fallback templates or mock responses.
3. Core learning, course viewing, assessments, and code practice remain fully functional.
4. Update status banner: "AI Copilot is operating in degraded mode; core courses unaffected."

### SOP-06: Object Storage Provider Disruption
1. If Cloudinary/S3 returns 5xx, verify API credentials and bucket status.
2. For student submissions, buffer upload metadata in MongoDB while retrying signed URL generation.
3. Serve cached assets through Edge CDN fallback.

### SOP-07: Email Delivery Provider Failure
1. If SendGrid/SMTP credentials or endpoints fail, notifications are pushed to the Dead Letter Queue.
2. Inspect worker error logs: `grep -i "email_failure" /var/log/apexlearn/worker.log`.
3. Switch outbound SMTP relay in `.env` to secondary fallback provider.
4. Trigger BullMQ re-drive on failed email queue jobs.

### SOP-08: Queue Backlog & Dead Letter Handling
1. Check queue depths:
   ```bash
   curl -fsS http://localhost:5000/metrics | grep queue_backlog
   ```
2. If backlog > 1,000, scale worker instances: `docker compose scale worker=4`.
3. Inspect Dead Letter Queue (`DLQ`) items:
   ```javascript
   const failedJobs = await queue.getFailed();
   console.log(`Failed jobs count: ${failedJobs.length}`);
   ```
4. Fix underlying issue and re-queue jobs using idempotent transaction keys.

### SOP-09: Security Incident & Credential Revocation
1. Identify affected account, token, or API key.
2. If JWT secret is compromised:
   - Generate new 64-character secret.
   - Update `JWT_SECRET` in secret manager.
   - Force rolling restart of backend containers (all active JWTs invalidated immediately).
3. If database credentials compromised:
   - Rotate MongoDB Atlas user password.
   - Update `MONGODB_URI` secret.
   - Cycle backend container fleet.
4. Record audit event in immutable audit log.
