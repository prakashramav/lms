# Incident Runbook: High API Error Rate (> 2% 5xx)

## Severity: P1 / P2

### Symptoms
- Elevated HTTP 5xx responses detected in structured logging or monitoring dashboard.
- Admin system alert triggered for high error rate.

---

### Triage & Diagnostics
1. Inspect structured logs for recent error events:
   ```bash
   grep '"level":"ERROR"' /var/log/edtech/api.log | tail -n 50
   ```
2. Identify top failing routes, status codes, and `errorCode`:
   - `DATABASE_ERROR` -> Check MongoDB connection pool and slow queries.
   - `AI_PROVIDER_ERROR` -> Check AI provider timeouts.
   - `INTERNAL_ERROR` -> Check stack trace details in staging logs.
3. Check CPU/Memory utilization across host nodes.

---

### Mitigation
1. If a bad release caused regression, trigger immediate deployment rollback (see `deployment-rollback.md`).
2. If traffic spike / DDoS is suspected, throttle via Cloudflare / edge WAF and enforce tighter IP rate limiting.
3. If specific feature is misbehaving, disable its feature flag in `/admin/features`.
