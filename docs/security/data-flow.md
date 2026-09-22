# Data Flow & Information Security Architecture

## 1. Data Classification Tiers

ApexLearn establishes five data classification categories with corresponding storage, transmission, and encryption requirements:

| Classification | Definition | Examples | Encryption at Rest | Encryption in Transit | Masking / Redaction |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Public** | Information approved for unauthenticated public discovery. | Course titles, public descriptions, instructor public bios, public verification pages. | Standard | TLS 1.3 | None |
| **Internal** | Operational data visible across authenticated platform users. | Course syllabi, community channel names, public events. | Standard | TLS 1.3 | None |
| **Private** | Personal learner data restricted to the individual and authorized instructors. | Course progress, quiz answers, private mentor notes, resume drafts. | AES-256 | TLS 1.3 | Hidden from peers |
| **Sensitive** | Highly confidential identifying information. | Email addresses, OAuth identities, ATS parsed contact info, IP addresses. | AES-256 | TLS 1.3 | Stripped from logs |
| **Restricted** | Critical secrets, credentials, and financial audit records. | Password hashes (bcrypt), JWT signing keys, payment transaction keys. | AES-256 / KMS | TLS 1.3 | Never logged / Never exposed |

---

## 2. End-to-End Data Flow Diagram

```mermaid
graph TD
    USER["Client Browser / Mobile App"] -->|HTTPS / TLS 1.3<br/>Strict Origin Whitelist| EDGE["Cloudflare Edge CDN / WAF"]
    EDGE -->|Reverse Proxy / Header Sanitization| LB["Load Balancer (Port 443 -> 5000)"]
    
    subgraph Gateway ["Express API Gateway"]
        LB --> MW_REQ["Request ID & Structured Logger<br/>(PII & Secret Redaction)"]
        MW_REQ --> MW_SEC["Security Headers & NoSQL Sanitizer"]
        MW_SEC --> MW_RAT["Rate Limiter & Idempotency Filter"]
        MW_RAT --> MW_AUTH["JWT Token & RBAC / ABAC Evaluator"]
    end

    subgraph ServiceCore ["Backend Application Modules"]
        MW_AUTH --> CTRL["Domain Controller & Service Layer"]
        CTRL --> MONGODRIVER["Mongoose ODM (Pooled Connections)"]
    end

    subgraph DataAtRest ["Persistence & Cloud Storage"]
        MONGODRIVER -->|TLS Encrypted Connection| MONGODB[("MongoDB Atlas<br/>AES-256 Encrypted Volumes")]
        CTRL -->|Presigned Upload URL (TTL 15m)| S3[("Object Storage (S3 / Cloudinary)<br/>Encrypted Private Buckets")]
    end

    subgraph ExternalEgress ["Controlled External Egress"]
        CTRL -->|HTTPS / API Key in Auth Header| AI["AI Provider (Gemini / OpenAI)"]
        CTRL -->|HTTPS / Webhook Signature Verified| PAY["Payment Provider (Razorpay / Stripe)"]
        CTRL -->|mTLS / Secure Sandbox Container| SANDBOX["Judge0 Code Execution Runner"]
    end
```

---

## 3. Ingress & Egress Boundaries

1. **Ingress Boundary**: All external client traffic is terminated at Edge CDN with TLS 1.3 and forwarded via HTTPS to the Express API. Plaintext HTTP (Port 80) is redirected to HTTPS (Port 443).
2. **Database Boundary**: Communication with MongoDB uses TLS-encrypted connections (`ssl=true`) with credentials injected via environment variables.
3. **Egress Boundary**: Outbound API calls to external vendors (Gemini, SendGrid, Razorpay) are authenticated using cryptographically secure tokens. External calls enforce a strict 10-second timeout ceiling to prevent socket hangs.
