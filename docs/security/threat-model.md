# Enterprise Threat Model & Attack Surface Analysis (STRIDE)

## 1. Overview
This threat model evaluates ApexLearn across the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) covering the core architectural pillars: Authentication, Authorization, Payments, AI, File Uploads, Community, and Multi-Tenancy.

---

## 2. Comprehensive STRIDE Matrix by Domain

| Threat Domain | STRIDE Category | Threat Scenario | Implemented Countermeasure | Verification Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Spoofing | Forged JWT access token or expired session replay | Cryptographically signed HMAC-SHA256 JWTs (15m expiry) + HttpOnly rotating refresh cookies. | `tests/auth.test.js` |
| **Authorization** | Elevation of Privilege | Student/Instructor escalates to Admin via body tampering | Mass assignment defense middleware strips `role`, `isSuperAdmin`, and `permissions` from request bodies. | `tests/productionHardening.test.js` |
| **Authorization** | Information Disclosure | Insecure Direct Object Reference (IDOR) to access peer grades | Resource-level ownership middleware (`resourceAuth.middleware.js`) strictly verifies `record.userId === req.user._id`. | `tests/resourceAuth.test.js` |
| **Payments** | Tampering | Client alters course purchase price in frontend payload | Server-side price lookups; client price is completely ignored. Zero trust in frontend payment claims. | `tests/certificates.test.js` |
| **Payments** | Repudiation | Customer disputes payment while claiming entitlement | Cryptographically verified webhook signatures with transaction IDs persisted in atomic transactions. | `tests/securityAudit.test.js` |
| **AI Copilot** | Tampering | Prompt injection attempting to leak system instructions or database credentials | Context-bounded Socratic prompts, static code sanitizer, and 3-strike circuit breaker router. | `tests/aiRouterCircuitBreaker.test.js` |
| **AI Copilot** | Information Disclosure | Cross-tenant or cross-student AI context bleeding | AI contexts are ephemeral and scoped strictly to the calling `studentId` without persistent cross-session memory. | `tests/rag.test.js` |
| **File Storage** | Tampering / DoS | Executable file uploaded disguised as a PDF or image | MIME-type sniffing, extension validation whitelist, 20MB payload ceiling, and storage in private buckets via signed URLs. | `tests/sandboxSecurity.test.js` |
| **Community** | Denial of Service | Automated bot flooding forum with spam posts | Tiered rate limiting (`generalLimiter`), duplicate content detection, and token-bucket throttle. | `tests/phase16LearningEcosystem.test.js` |
| **Multi-Tenancy** | Information Disclosure | Org A queries courses or user rosters belonging to Org B | Tenant ID filtering strictly injected on database query predicates; cross-tenant requests yield 403 Forbidden. | `tests/phase16DataQualityAndCohorts.test.js` |
| **Code Sandbox** | Denial of Service / DoS | Fork bomb or infinite loop in student submitted code | Isolated Judge0 containers with 5.0s execution timeout and 128MB RAM hard limits. | `tests/sandboxSecurity.test.js` |

---

## 3. Threat Mitigation Summary
All security mitigations are evaluated server-side. No client-side checks or frontend state are trusted as authoritative security controls.
