# Incident Runbook: Redis / Cache Down

## Severity: P2 (Major)

### Symptoms
- Rate limiter, session cache, or recommendation caching reports connection timeout.
- Background worker queues pause processing.

---

### Triage & Diagnostics
1. Test Redis connectivity:
   ```bash
   redis-cli -u "$REDIS_URL" ping
   ```
2. Check Redis service status:
   ```bash
   docker compose logs redis --tail 50
   ```

---

### Mitigation & Graceful Degradation
1. **Graceful Fallback**: The LMS API is architected with graceful degradation. When Redis is offline, rate limiters automatically fail-open in memory, and queries query MongoDB directly.
2. **Restart Redis**:
   ```bash
   docker compose restart redis
   ```
3. **Verify Worker Recovery**: Once Redis responds with `PONG`, background worker queues automatically resume pending items.
