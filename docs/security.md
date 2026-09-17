# Platform Security & Hardening Specification

## 1. Authentication & Credential Security
- **Bcrypt Hashing**: User passwords are encrypted with bcrypt (10 rounds of cryptographic salting). Passwords are never stored in plaintext.
- **Leak Prevention**: `password`, `resetPasswordToken`, and `emailVerificationToken` fields use `select: false` on Mongoose schemas. `toJSON` schema transforms delete all sensitive fields from serialized responses.
- **Password Reset Tokens**: Single-use tokens generated via `crypto.randomBytes(32).toString('hex')`, hashed or stored with 1-hour expiration. Executing a password reset terminates and revokes all existing refresh tokens for the user.

---

## 2. Token & Session Management
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_SECRET` (minimum 32-character high entropy key).
- **Refresh Tokens**: Cryptographically unique tokens stored in the database with creation metadata, IP, user-agent, and explicit `revokedAt` timestamps.
- **Cookie Hardening**: Delivered using `HttpOnly`, `Secure` (in production), and `SameSite=Strict`/`SameSite=Lax`. Insecure wildcard cookie domains are prohibited.
- **Logout**: Invalidates the database refresh token record and immediately clears the client cookie.

---

## 3. Authorization & RBAC
- **Strict Role Boundaries**:
  - `STUDENT`: Accesses discovery, enrollments, lessons, assessments, coding practice, and personal submissions. Blocked from course authoring, admin panels, and other students' private data.
  - `INSTRUCTOR`: Manages own courses, curriculum modules, lessons, question banks, and cohort analytics. Blocked from admin dashboards, platform settings, or editing other instructors' courses.
  - `ADMIN`: Manages user approval, course approvals, moderation reports, analytics, audit logs, and system health.
  - `SUPER_ADMIN`: Manages platform settings, admin user privileges, and system-level configurations.
- **IDOR Protection**: All resource-mutating endpoints verify that the requesting user owns the entity (e.g. course instructor match) before applying changes.

---

## 4. Input Validation & Mass Assignment Protection
- **Mass Assignment Guard**: `massAssignment.middleware.js` automatically strips unauthorized privilege fields (`role`, `permissions`, `isSuperAdmin`, `publishedBy`, `auditFields`, `status`) from non-admin payloads.
- **NoSQL Injection Guard**: `sanitize.middleware.js` recursively strips any keys starting with `$` or containing `.` from `req.body`, `req.query`, and `req.params`.
- **Request Size Capping**: JSON and URL-encoded bodies are strictly capped at 20MB to prevent denial-of-service via memory exhaustion.

---

## 5. Security Headers & CORS Policy
- **Helmet Headers**:
  - Content Security Policy (CSP) tailored for Next.js assets, Monaco editor, and trusted APIs.
  - `X-Frame-Options: DENY` preventing clickjacking.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Strict-Transport-Security (HSTS)` active on HTTPS environments with preload.
- **CORS Allowlist**: Restricted exclusively to configured frontend origins (`STUDENT_APP_URL`, `INSTRUCTOR_APP_URL`, `ADMIN_APP_URL`). Wildcard `*` origins are rejected for authenticated endpoints.

---

## 6. Rate Limiting Strategy
Endpoints are segmented into distinct rate-limiting zones:
- **Authentication (`/api/v1/auth/*`)**: 25 requests per 15 minutes.
- **AI Tutor (`/api/v1/ai/*`)**: 30 requests per minute per user/IP.
- **Code Execution (`/api/v1/practice/problems/:id/run|submit`)**: 20 requests per minute.
- **Admin Endpoints (`/api/v1/admin/*`)**: 300 requests per 15 minutes.
- **General API (`/api/*`)**: 500 requests per 15 minutes.

---

## 7. Sandbox Execution Security
- **Worker Isolation**: Untrusted code runs in isolated runner containers or sandboxed processes.
- **Resource Constraints**: Capped at 2000ms–5000ms CPU time and 128MB–256MB RAM per execution.
- **Hidden Test Secrecy**:
  - Test cases marked with `isHidden: true` have inputs and expected outputs redacted from all student-facing responses.
  - Error messages from hidden tests do not reveal expected values.

---

## 8. AI Safety & Cost Control
- **Prompt Size Guard**: Input prompts are limited to 8000 characters.
- **Token Bounds**: AI responses are bounded by token generation ceilings (`maxTokens: 2048`).
- **Failover**: If upstream AI providers error or timeout, the service responds with safe, standardized fallback messages (`"AI service is temporarily unavailable"`) without leaking provider keys or internal stack traces.

---

## 9. Audit Logging & Request ID Tracing
- **Request Tracing**: Inbound requests receive or generate an `X-Request-ID` passed through logs, responses, and error handlers.
- **Audit Trails**: Critical security events (user suspension, role changes, course approvals, content moderation, setting changes) are persisted to the `AuditLog` collection with actor ID, IP, user-agent, and action timestamps.
