# Operational Risk Register

| Risk ID | Identified Risk Description | Probability | Impact | Mitigation Strategy | Owner | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | External AI Provider Rate Limits / Downtime | High | Medium | Implemented `aiRouter` with 3-strike circuit breaker and automated fallback to secondary provider and deterministic mock. | AI / Backend Team | **MITIGATED** |
| **RSK-02** | Credential Stuffing / Brute Force on Auth | Medium | High | Strict rate limiting (25 attempts per 15 minutes per IP) on `/api/v1/auth/login`. | Security Team | **MITIGATED** |
| **RSK-03** | Insecure Direct Object Reference (IDOR) | Medium | High | Enforced `requireCourseOwnership` and `requireStudentResourceOwnership` middleware on mutating endpoints. | Backend Team | **MITIGATED** |
| **RSK-04** | MongoDB Single-Node Disk Exhaustion | Low | High | Documented automated backup snapshot rotation and non-destructive JSON restore procedure in runbooks. | DevOps / SRE | **MITIGATED** |
| **RSK-05** | Accidental Secret Leakage in Environment Files | Medium | High | Audit confirmed `.env.example` contains only variable names without raw values; production env validator checks presence. | DevOps | **MITIGATED** |
| **RSK-06** | Excessive Resource Consumption via File Uploads | Low | Medium | Enforced 20MB payload body parser limit and dedicated file upload rate limiter. | Backend Team | **MITIGATED** |
| **RSK-07** | Client-Side Exception Rendering Blank Screen | Low | Medium | Deployed Next.js App Router `error.jsx` and `not-found.jsx` across Student, Instructor, and Admin apps. | Frontend Team | **MITIGATED** |
