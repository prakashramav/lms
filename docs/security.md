# Platform Security Specification

## 1. Password Protection & Cryptographic Standards
- **Hashing**: Passwords are saved exclusively after running through bcrypt with 10 salt rounds.
- **Complexity Enforcement**: Passwords must contain a minimum of 8 characters, combining uppercase/lowercase letters and numeric digits.
- **Non-Disclosure**: The `password` field in Mongoose has `select: false` so queries never accidentally leak hashes. Mongoose `toJSON` transforms actively strip password and token hashes from serialization output.

## 2. Token Security & Token Invalidation
- **Session Revocation**: Password reset immediately revokes all active refresh tokens for the affected user, terminating active sessions on other devices.
- **Refresh Token Invalidation**: Logout marks the specific refresh token as revoked (`revokedAt: new Date()`) and deletes the client-side cookie.
- **Rotation Replay Protection**: Refreshing requires an active, unrevoked token hash. Replaying an old token fails immediately.

## 3. Rate Limiting & Brute-Force Defense
- Auth endpoints (`/api/v1/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/refresh`) are guarded by `express-rate-limit`.
- Clients attempting excessive authentication bursts receive `HTTP 429 Too Many Requests` (`TOO_MANY_REQUESTS`).

## 4. Origin & Cookie Isolation (CORS & CSP)
- Express `cors` uses an allowlist containing exact development origins (`http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`) and forbids wildcard `*` with credentials.
- Cookies use `httpOnly: true`, preventing JavaScript XSS access. In production, `secure: true` enforces HTTPS delivery.
- HTTP security headers are handled via `helmet`.
