# Incident Runbook: Database Unavailable (MongoDB)

## Severity: P1 (Critical)

### Symptoms
- `/ready` endpoint returns HTTP 503 `NOT_READY`.
- Backend logs show `[MongoDB Connection Error]` or `MongoServerSelectionError`.
- Student and instructor requests fail with `500 DATABASE_ERROR`.

---

### Triage & Diagnostics
1. Check readiness probe:
   ```bash
   curl -i https://api.yourdomain.com/ready
   ```
2. Check MongoDB cluster status:
   - For Atlas: inspect cloud dashboard for node failovers, disk exhaustion, or maintenance.
   - For self-hosted: check systemd service / docker container:
     ```bash
     docker compose ps mongodb
     docker compose logs mongodb --tail 50
     ```
3. Test direct database ping:
   ```bash
   mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
   ```

---

### Immediate Mitigation Steps
1. **Network Connectivity**: Verify IP allowlist and security group ingress rules for port 27017.
2. **Resource Exhaustion**: If memory/CPU is pegged at 100%, trigger automated cluster scaling.
3. **Failover**: If a replica set primary node is unresponsive, initiate manual failover to healthy secondary.
4. **App Server Reconnect**: The backend utilizes connection retries with exponential backoff (max 3 retries, up to 5s delay). Once the database recovers, traffic will resume without restarting pods.
