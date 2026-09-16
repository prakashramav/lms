# Authentication & RBAC Architecture Documentation

## 1. Overview

The platform implements a multi-tenant, role-based access control (RBAC) authentication engine designed to support three distinct client applications:
1. **Student Application** (`apps/student` on `http://localhost:3000`)
2. **Instructor Application** (`apps/instructor` on `http://localhost:3001`)
3. **Admin Application** (`apps/admin` on `http://localhost:3002`)

All three frontends communicate with the unified backend REST API (`apps/backend` on `http://localhost:5000/api/v1`).

---

## 2. Token Architecture (Dual-Token Strategy)

### Access Token (JWT)
- **Lifetime**: 15 minutes (short-lived)
- **Format**: JSON Web Token (JWT)
- **Payload**:
  ```json
  {
    "userId": "6648b2a19...",
    "role": "STUDENT | INSTRUCTOR | ADMIN"
  }
  ```
- **Transmission**: Sent via HTTP `Authorization: Bearer <accessToken>` header on protected API requests.

### Refresh Token (Database-Backed & Rotated)
- **Lifetime**: 7 days
- **Format**: 80-character cryptographically secure hex string (`crypto.randomBytes(40)`).
- **Storage**: Stored as an irreversible SHA-256 cryptographic hash in MongoDB (`RefreshToken` collection). The raw token is never persisted in plaintext.
- **Delivery**: Sent via secure, HTTP-only cookie (`refreshToken`), with fallback support in request body for non-browser clients.
- **Rotation**: On each refresh request (`POST /api/v1/auth/refresh`), the used refresh token is immediately revoked (`revokedAt: new Date()`) and a new pair (access token + refresh token) is issued. Any re-use of an already-revoked token triggers immediate rejection to protect against replay attacks.

---

## 3. Role-Based Access Control (RBAC)

The system defines 3 foundational roles:

| Role | Access Scope | Registration Path |
|---|---|---|
| `STUDENT` | Access to courses, live coding playgrounds, AI tutor, mock interviews, jobs | Public self-service registration (`POST /api/v1/auth/register`) |
| `INSTRUCTOR` | Course authoring, test suite builder, cohort telemetry, student reviews | Academic provision / Admin invitation |
| `ADMIN` | Platform governance, user management, sandbox monitoring, audit logs | Seeded credentials / Root console provision |

### Strict Public Registration Boundary
The public registration endpoint (`/api/v1/auth/register`) automatically overrides and forces the role to `STUDENT`. Any malicious payload attempting to inject `role: 'ADMIN'` or `role: 'INSTRUCTOR'` is sanitized and assigned `STUDENT`.

### Cross-App Access Protection
If a user with role `STUDENT` attempts to log in to the Admin portal (`apps/admin`), the backend inspects `expectedRole: 'ADMIN'` against the user's stored role. If mismatched, the server rejects the attempt with `HTTP 403 Forbidden` (`ROLE_MISMATCH`).

---

## 4. Development Seed Accounts

For local development and evaluation, predefined test accounts are provided:

```bash
npm run seed
```

| Portal | Role | Email | Password | URL |
|---|---|---|---|---|
| **Student** | `STUDENT` | `student@example.com` | `StudentPass123!` | http://localhost:3000 |
| **Instructor** | `INSTRUCTOR` | `instructor@example.com` | `InstructorPass123!` | http://localhost:3001 |
| **Admin** | `ADMIN` | `admin@example.com` | `AdminPass123!` | http://localhost:3002 |

> [!WARNING]
> These credentials are for **LOCAL DEVELOPMENT ONLY**. Never deploy these credentials into a staging or production environment.
