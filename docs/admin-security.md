# Admin Security Architecture

## 1. Principles of Least Privilege & Role Isolation
The platform implements a multi-tier authorization hierarchy:
- `SUPER_ADMIN`: Root authority. Can provision and decommission administrators, alter granular permission grants, configure global system settings, and inspect system-wide audit telemetry.
- `ADMIN`: Operational administrator. Operates with scoped permissions (`users.read`, `courses.approve`, `reports.manage`, etc.). Cannot create or modify other administrators, elevate permissions, or bypass security rules.
- `INSTRUCTOR`: Content author. Strictly denied access to any `/api/v1/admin/*` endpoints or the admin web client.
- `STUDENT`: Learner. Strictly denied access to any `/api/v1/admin/*` endpoints or the admin web client.

## 2. Multi-Factor Authentication (MFA)
- Admin login provides architecture for Two-Factor Authentication (TOTP / Hardware key verification).
- Configurable per security policy: privileged administrators can be required to present a second factor before session token issuance.

## 3. Defense Against Common Vulnerabilities
- **IDOR (Insecure Direct Object Reference)**: Every resource manipulation verifies entity ownership, existence, and status. Unauthorized role transitions return `403 Forbidden`.
- **NoSQL Injection**: Search queries escape special regex symbols (`query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`). Uncontrolled operator injection (such as `$gt`, `$where`) is sanitized before query execution.
- **Cross-Site Scripting (XSS)**: Strict JSON APIs with parameterized Next.js rendering; no untrusted HTML is rendered directly without sanitization.
- **Rate Limiting**: Sensitive administrative endpoints, login attempts, and bulk operations are throttled via Express rate limiters to prevent brute-force attacks.
- **Privacy Protections**: Passwords, password hashes, refresh tokens, and private student-to-AI conversation transcripts are explicitly excluded from administrative query projections (`-password`, minimum necessary projection).
