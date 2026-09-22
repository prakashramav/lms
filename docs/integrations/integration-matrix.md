# Platform Integration Matrix & Architecture

## 1. Integration Interfaces Overview
To preserve clean boundaries without vendor lock-in, all third-party integrations operate behind standardized provider abstractions in `apps/backend/src/services/`.

---

## 2. Integration Matrix

| Integration Domain | Provider Interface | Implementations | Configuration Env Keys | Failure Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Artificial Intelligence** | `AIProvider` (`aiRouter.js`) | Google Gemini 1.5, OpenAI GPT-4o, Resilient Mock | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_PROVIDER` | Circuit breaker trips after 3 strikes; auto-fallback to secondary provider & mock. |
| **Object File Storage** | `StorageProvider` (`storage.service.js`) | Cloudinary, S3-Compatible Storage, Local FS Fallback | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Graceful fallback to local uploads directory (`apps/backend/uploads`). |
| **Code Execution Sandbox**| `SandboxRunner` (`practice.service.js`) | Judge0 API, Local Process Runner Fallback | `JUDGE0_API_URL`, `JUDGE0_API_KEY` | Sandboxed local process runner with 5s timeout & 128MB memory cap. |
| **Email Communications** | `EmailProvider` (`email.service.js`) | SendGrid / AWS SES API, Local Console Logger | `EMAIL_API_KEY` | Logged to console in development; queued for async retry in production. |
| **Payment & Billing** | `PaymentProvider` (`billing.service.js`) | Razorpay API, Mock Payment Gateway | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side signature verification; idempotent webhook handling. |

---

## 3. Webhook Architecture & Security Standards
1. **Signature Verification**: Every incoming webhook must pass cryptographic signature verification (HMAC-SHA256) prior to body consumption.
2. **Idempotency**: All webhook events enforce unique `event_id` deduplication via `idempotency.middleware.js` to eliminate double processing on network retries.
