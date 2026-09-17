# Incident Runbook: Security Incident Response

## Severity: P0 / P1

### Trigger Scenarios
- Credential stuffing or repeated brute force attacks on `/api/v1/auth/login`.
- Suspected IDOR vulnerability exploitation or privilege escalation attempt.
- Malicious payload detected attempting SSRF or code sandbox escape.

---

### Immediate Containment Steps
1. **IP / Actor Blocking**:
   - Add malicious source IP addresses to edge WAF blocklist (Cloudflare / AWS WAF).
   - In Admin Dashboard (`/users`), suspend the compromised user account (`status: SUSPENDED`).
2. **Session Invalidation**:
   - Invalidate all active refresh tokens for compromised accounts:
     ```javascript
     await RefreshToken.updateMany({ userId: targetUserId }, { $set: { isRevoked: true } });
     ```
3. **Secret Rotation**:
   - If JWT secrets or API keys are suspected leaked, immediately rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` and redeploy. All sessions will require re-authentication.
4. **Audit Log Inspection**:
   - Query immutable audit logs by `actorId`, `ipAddress`, and `timestamp` to identify all affected records:
     ```javascript
     db.auditlogs.find({ actorId: targetUserId }).sort({ timestamp: -1 });
     ```
