# Security Model & Threat Architecture

## 1. Authentication & Session Architecture
1. **Access Tokens**: Short-lived JSON Web Tokens (JWT) signed with HMAC-SHA256, expiring in 15 minutes.
2. **Refresh Tokens**: Long-lived cryptographic tokens (7-day validity) stored in `httpOnly`, `sameSite=strict`, and `secure` cookies to eliminate client-side JavaScript access and defend against XSS-driven token theft.
3. **Password Security**:
   - Salted and hashed using `bcryptjs` with a work factor of 10 rounds.
   - Plaintext passwords are never persisted and explicitly omitted from queries via `{ select: false }`.
   - Never logged or transmitted in telemetry payloads.
4. **Password Reset Flow**:
   - Single-use cryptographically generated tokens with 1-hour expiration.
   - Cleared and invalidated immediately upon successful credential update.

---

## 2. Authorization & Insecure Direct Object Reference (IDOR) Defense
1. **Role-Based Access Control (RBAC)**:
   - Evaluated via `authorize(...allowedRoles)` middleware.
   - Pre-configured roles: `STUDENT`, `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`, `EMPLOYER`.
2. **Resource-Level Authorization (`resourceAuth.middleware.js`)**:
   - Mutating course operations verify that `req.user._id` matches `course.instructor`.
   - Mutating student resources (resumes, portfolios, job applications) verify that `req.user._id` matches `resource.studentId`.
   - Cross-student data modifications return HTTP 403 `FORBIDDEN_RESOURCE_ACCESS`.

---

## 3. Input Sanitization & Attack Surface Hardening
1. **NoSQL Injection Defense (`sanitize.middleware.js`)**:
   - Recursively traverses request bodies, query strings, and parameter objects.
   - Strips dangerous MongoDB operator keys beginning with `$` or containing `.`.
2. **Mass Assignment Guard (`massAssignment.middleware.js`)**:
   - Blocks unauthorized privilege escalation attempts by discarding reserved fields (`role`, `permissions`, `isSuperAdmin`, `publishedBy`, etc.) when submitted by non-administrators.
3. **Cross-Site Scripting (XSS) & Content Security**:
   - Helmet middleware applies strict HTTP security headers:
     - `Content-Security-Policy`: Disallows unauthorized script injection.
     - `X-Content-Type-Options: nosniff`: Mitigates MIME sniffing.
     - `X-Frame-Options: DENY`: Prevents Clickjacking attacks.
     - `Strict-Transport-Security (HSTS)`: Enforces HTTPS communication in production.
4. **Rate Limiting Protection**:
   - Tiered rate limiters protect sensitive endpoints against credential stuffing, brute force, and denial of service:
     - General API: 500 req / 15m.
     - Authentication: 25 req / 15m.
     - AI Prompts: 30 req / 1m.
     - Coding Executions: 20 req / 1m.
     - Admin Routes: 300 req / 15m.

---

## 4. Multi-Tenancy & Tenant Isolation
1. Organization boundaries are enforced at the database query layer:
   - Cohorts, job listings, and employer applicant reviews are explicitly filtered by `organizationId`.
   - Cross-organization queries return 403 Forbidden or empty datasets.
