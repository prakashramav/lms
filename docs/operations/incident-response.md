# Incident Response & Management Playbook

## 1. Incident Severity Definitions

| Severity | Name | Description | Response SLA | Target Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | Critical Outage | Core service totally down (API unreachable, DB crash, auth broken). | < 15 minutes | < 2 hours |
| **P1** | High Impact | Core workflow broken for multiple users (cannot submit exams, enroll, or stream video). | < 30 minutes | < 4 hours |
| **P2** | Medium Impact | Non-critical feature degraded (AI tutor slow, analytics delay, avatar upload error). | < 2 hours | < 24 hours |
| **P3** | Low Impact | Minor UI cosmetic glitch, documentation typo, non-blocking bug. | < 24 hours | Next release |

---

## 2. Incident Response Workflow

```
[Detection] ──> [Triage & Classify] ──> [Mitigation & Hotfix] ──> [Resolution & Verify] ──> [Postmortem]
```

### Step 1: Detection & Alerting
- Health checks return status `NOT_READY` via `/ready`.
- Error rate in `/metrics` exceeds 2% threshold over a 5-minute rolling window.
- Student or Instructor support ticket flagged with `URGENT`.

### Step 2: Triage & Communication
- Incident Commander (Lead On-Call Engineer) acknowledges alert.
- Update internal status board: Declare Severity (P0-P3), affected components, and current mitigation lead.
- If P0: Notify active users via banner or incident broadcast.

### Step 3: Mitigation
- **Rollback Option**: If incident followed a recent deployment, immediately roll back to previous stable release tag:
  ```powershell
  git checkout <previous_stable_tag>
  npm run build
  ```
- **Circuit Breaking**: If external integration (AI provider, payment gateway) is failing, trip the circuit breaker to route to fallback mocks or cached responses.
- **Failover**: If MongoDB primary is unresponsive, trigger replica set step-down / step-up.

### Step 4: Resolution & Verification
- Verify health status: `curl http://localhost:5000/health` and `http://localhost:5000/ready`.
- Execute automated smoke tests across Student, Instructor, and Admin frontends.
- Confirm error rate in `/metrics` returns to baseline (< 0.1%).

### Step 5: Blameless Postmortem
Every P0 and P1 incident requires a documented postmortem within 48 hours containing:
1. Incident Timeline (UTC timestamps).
2. Root Cause Analysis (5 Whys).
3. Impact Summary (users affected, failed requests).
4. Preventative Action Items with assigned owners and target completion dates.
