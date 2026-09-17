# Phase 15 Enterprise Threat Model & Attack Surface Analysis

## 1. STRIDE Threat Analysis

| Category | Threat Scenario | Mitigation in Place |
|---|---|---|
| **Spoofing** | Forged JWT tokens or identity impersonation | Cryptographically signed HMAC-SHA256 JWTs with 15m access tokens and secure HTTP-only refresh tokens. |
| **Tampering** | Parameter tampering or NoSQL injection (`$ne`, `$gt`) | Recursive input sanitizer stripping dangerous MongoDB operators; Mongoose strict schema casting. |
| **Repudiation** | Denying an administrative or hiring pipeline action | Append-only `AuditLog` records with actor ID, role, resource, before/after metadata, and timestamps. |
| **Information Disclosure** | IDOR access to another student's resume or draft course | `resourceAuth.middleware.js` strictly enforcing resource ownership by user and organization. |
| **Denial of Service** | High-volume API spam or infinite loops in coding sandbox | Tiered rate limiting, request timeout bounds (15s), coding sandbox execution limits (5s, 128MB). |
| **Elevation of Privilege** | Student attempting to call Admin or Instructor endpoints | Explicit `authorize('ADMIN')` RBAC guards and immutable role updates in `User.save()`. |

## 2. AI Security & Prompt Injection
- **Indirect Prompt Injection**: Malicious instructions within job descriptions, resumes, or course comments attempting system prompt overrides are neutralized via bounded context prompts and safety evaluators (`aiEvaluator.js`).
- **Data Leakage Defense**: Golden evaluation datasets continuously verify that database credentials, internal server configurations, and API keys are never output by generative AI endpoints.
