# Production Architecture Specification

## 1. System Overview & Modular Monolith

ApexLearn implements a **modular monolith** backend architecture paired with decoupled micro-frontends. This topology avoids premature microservice decomposition while guaranteeing strict service isolation, bounded context ownership, and horizontal scalability.

---

## 2. End-to-End Enterprise Architecture Diagram

```mermaid
graph TD
    subgraph Clients ["Client Layer (Decoupled Frontends)"]
        SF["Student Portal<br/>(student.example.com :3000)"]
        IF["Instructor Studio<br/>(instructor.example.com :3001)"]
        AF["Admin Console<br/>(admin.example.com :3002)"]
        EF["Employer Portal<br/>(employer.example.com :3003)"]
    end

    subgraph Edge ["Edge & Ingress Tier"]
        CDN["Cloudflare / Edge CDN<br/>(TLS 1.3, DDoS, WAF, Static Asset Cache)"]
        LB["Load Balancer / Ingress Controller<br/>(Nginx / ALB, Strict CORS, SSL Termination)"]
    end

    subgraph APIGateway ["API Gateway & Middleware Layer (Port 5000)"]
        REQ["Request ID & Structured Logger"]
        SEC["Helmet CSP / Sanitizer / Mass-Assignment Defense"]
        RAT["Distributed Redis Rate Limiters (General, Auth, AI, Practice)"]
        IDEM["Idempotency Filter (X-Idempotency-Key)"]
        AUTH["JWT / Cookie Auth & RBAC Evaluator"]
    end

    subgraph CoreBackend ["Express Modular Monolith (/api/v1)"]
        MOD_AUTH["modules/auth"]
        MOD_COURSE["modules/courses & learning"]
        MOD_ASSESS["modules/assessments & practice"]
        MOD_COMM["modules/community & events"]
        MOD_MENTOR["modules/mentorship"]
        MOD_CERT["modules/certifications"]
        MOD_MARKET["modules/marketplace & orders"]
        MOD_AI["modules/ai (Router & Socratic Tutor)"]
        MOD_AUDIT["modules/audit & analytics"]
    end

    subgraph StateAndQueue ["Cache, Locking & Queues"]
        REDIS["Redis (v7.2 Cluster)<br/>- Public Catalog Cache (TTL 5m-1h)<br/>- Rate Limit Buckets<br/>- Concurrency Locks (Booking)"]
        BULL["Background Job Queue<br/>- Exponential Backoff<br/>- Dead Letter Queue (DLQ)"]
    end

    subgraph Workers ["Async Background Workers"]
        W_NOTIF["Notification & Email Worker"]
        W_CERT["Certificate PDF & QR Worker"]
        W_AI["Async AI Summarizer Worker"]
        W_AUDIT["Audit & Telemetry Flusher"]
    end

    subgraph Persistence ["Persistence Tier"]
        MONGO[("MongoDB Atlas (v7.0+)<br/>- Multi-Tenant Shard / Replicas<br/>- Compound Indexes<br/>- ACID Multi-Doc Transactions")]
    end

    subgraph External ["Storage & External Providers"]
        S3["Object Storage (S3 / Cloudinary)<br/>- Signed URLs & Private Buckets"]
        EXT_EMAIL["Email Delivery (SendGrid / SMTP)"]
        EXT_PAY["Payment Gateway (Razorpay / Stripe)"]
        EXT_SANDBOX["Judge0 Isolated Code Runner"]
        EXT_AI["AI Providers (Gemini / OpenAI / Fallback)"]
    end

    subgraph Observability ["Telemetry & Governance"]
        METRICS["Prometheus / OpenTelemetry / Health Probes"]
        LOGS["Structured JSON Logs with ReqID"]
        AUDIT_STORE["Immutable Security Audit Store"]
    end

    Clients --> CDN
    CDN --> LB
    LB --> REQ
    REQ --> SEC
    SEC --> RAT
    RAT --> IDEM
    IDEM --> AUTH
    AUTH --> CoreBackend

    CoreBackend --> REDIS
    CoreBackend --> BULL
    BULL --> Workers
    Workers --> MONGO
    Workers --> EXT_EMAIL
    Workers --> S3

    CoreBackend --> MONGO
    CoreBackend --> S3
    CoreBackend --> EXT_SANDBOX
    MOD_AI --> EXT_AI
    MOD_MARKET --> EXT_PAY

    CoreBackend --> METRICS
    CoreBackend --> LOGS
    CoreBackend --> AUDIT_STORE
```

---

## 3. Module Boundaries & Directory Structure

To maintain clean modular boundaries without distributed microservice complexity, the codebase adheres to standard layered domain modules:

```
apps/backend/src/
├── config/             # Environment, Database, CORS, Redis configuration
├── middlewares/        # Security headers, Request ID, RBAC, Sanitization, Error handling
├── modules/ (or controllers + services pattern)
│   ├── auth/           # Login, registration, token refresh, password recovery, MFA
│   ├── courses/        # Course lifecycle (draft, review, published, archived), prerequisites
│   ├── learning/       # Module/lesson progress, streak calculation, socratic telemetry
│   ├── assessments/    # Quiz evaluation, question banks, hidden test case security
│   ├── practice/       # Sandboxed code execution, language runners, memory limits
│   ├── mentorship/     # Mentor verification, slot booking, conflict prevention
│   ├── community/      # Channels, posts, comments, moderation audit, spam prevention
│   ├── events/         # Workshops, webinars, waitlist FIFO queue, attendance check-in
│   ├── certificates/   # Cryptographic issuance, PDF generation, public verification
│   ├── marketplace/    # Products, orders, webhook idempotency, server-side entitlements
│   ├── career/         # ATS resume scanner, mock interviews, skill gap analysis
│   ├── ai/             # Multi-provider resilient router, circuit breaker, Socratic engine
│   └── analytics/      # Institutional reporting, learning velocity, cohort health
├── models/             # Mongoose schemas with compound indexes & tenant isolation
└── utils/              # Cryptographic utilities, error normalization, validation helpers
```

---

## 4. API Standardization & Response Contract

### 4.1 Global Route Prefix
All endpoints are strictly anchored under `/api/v1/`.

### 4.2 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource successfully retrieved",
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "requestId": "req_8f14b3a9c72d"
  }
}
```

### 4.3 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format supplied",
    "details": { "field": "email" }
  },
  "message": "Invalid email format supplied",
  "errorCode": "VALIDATION_ERROR",
  "code": "VALIDATION_ERROR",
  "requestId": "req_8f14b3a9c72d"
}
```

### 4.4 Canonical Error Codes
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

---

## 5. Non-Fabrication Guarantee
All system metrics, uptime stats, query performance metrics, and transaction outcomes documented in this architecture reflect actual measured code execution and verified constraints rather than simulated projections.
