# Phase 17 Enterprise System Architecture

## 1. Executive Summary & Topology
The platform employs a modular, decoupled, and highly observable architecture separating multi-role client portals (Student, Instructor, Admin, and Employer), a unified RESTful API Gateway with strict RBAC/IDOR controls, a resilient multi-provider AI routing layer with circuit breaker protections, asynchronous job workers with Dead Letter Queues (DLQ), and persistent storage backed by MongoDB 7.0 and Redis.

```mermaid
flowchart TD
    subgraph Clients ["Client Layer (Next.js 14 App Router)"]
        StudentApp["Student Portal (:3000)<br/>• Learning Player<br/>• AI Tutor & Assessments<br/>• Career Intelligence"]
        InstructorApp["Instructor Studio (:3001)<br/>• Curriculum Authoring<br/>• Cohort Analytics<br/>• Assessment Designer"]
        AdminApp["Admin Console (:3002)<br/>• Platform Governance<br/>• User & RBAC Auditing<br/>• System Health & Telemetry"]
        EmployerApp["Employer Workflows<br/>• Job Postings<br/>• Candidate ATS Pipeline<br/>• Verified Credential Checks"]
    end

    subgraph Edge ["Edge & Ingress"]
        CDN["Edge CDN / SSL Termination / DDoS Mitigation"]
    end

    subgraph Gateway ["Backend API Gateway (:5000 Express.js)"]
        ReqTrace["Request Tracing Middleware (X-Request-ID)"]
        SecHeaders["Security Headers (Helmet, CSP, HSTS, NoSniff)"]
        RateLimits["Tiered Rate Limiters (General, Auth, AI, Coding, Admin)"]
        Sanitization["NoSQL Sanitization & Mass Assignment Guard"]
        AuthModule["JWT Auth (15m Access / 7d Refresh HttpOnly)"]
        RBAC["Role-Based Access Control (STUDENT, INSTRUCTOR, ADMIN, etc.)"]
        IDOR["Resource-Level Authorization (requireResourceOwnership)"]
        AuditLayer["Immutable Audit Log Layer"]
        Obs["Telemetry & Observability (/metrics, /health, /ready)"]
    end

    subgraph ServiceLayer ["Service & Business Domain Layer"]
        CourseSvc["Course & Curriculum Service"]
        LearningIntelSvc["Learning Intelligence & Spaced Review Engine"]
        CareerSvc["Career Ecosystem & ATS Matching Engine"]
        AssessmentSvc["Assessment & Grading Engine"]
        CertSvc["Certificate Issuance & Cryptographic Verification"]
        SandboxSvc["Coding Sandbox Execution Engine (Judge0)"]
        QueueSvc["Asynchronous Queue & Dead Letter Queue (DLQ)"]
    end

    subgraph AIRouting ["Resilient AI Infrastructure"]
        AIRouter["AI Provider Router"]
        CircuitBreaker["Circuit Breaker (3 Strikes, Cooldown Timer)"]
        GeminiProv["Primary: Google Gemini 1.5"]
        OpenAIProv["Secondary: OpenAI GPT-4o"]
        MockProv["Fallback: Resilient Deterministic Mock"]
    end

    subgraph Persistence ["Persistence, Caching & Storage"]
        MongoDB[("MongoDB 7.0 Replica Set<br/>• Compound Indexes<br/>• Multi-Tenancy Data Isolation")]
        RedisCache[("Redis Cache / In-Memory Store<br/>• Rate Limits & Idempotency<br/>• Session & Telemetry Buffers")]
        Storage[("Object Storage (S3 / Cloudinary / Local)<br/>• Resume PDFs, Course Videos, Certificates")]
    end

    Clients --> Edge
    Edge --> Gateway
    Gateway --> ServiceLayer
    ServiceLayer --> AIRouting
    AIRouting --> GeminiProv
    AIRouting -. Fallback .-> OpenAIProv
    AIRouting -. Fallback .-> MockProv
    ServiceLayer --> Persistence
```

---

## 2. Core Service Boundaries

| Service Domain | Primary Responsibility | Associated Models |
| :--- | :--- | :--- |
| **Authentication & IAM** | Credential validation, JWT issuance, password reset, rate-limited auth | `User`, `RefreshToken` |
| **Course & Curriculum** | Catalog browsing, module/lesson hierarchy, enrollment tracking, video player | `Course`, `Module`, `Lesson`, `Enrollment`, `Progress` |
| **Learning Intelligence** | Diagnostic assessments, knowledge gap tracking, spaced review scheduling, cohort analytics | `DiagnosticAttempt`, `SpacedReview`, `LearningProfile`, `Cohort` |
| **Career & ATS Pipeline** | Job board, career pathing, automated resume builder, application tracking | `Job`, `JobApplication`, `Resume`, `CareerProfile`, `Company` |
| **Assessment & Grading** | Quiz/exam attempts, automated scoring, mistake tracking | `Assessment`, `AssessmentAttempt`, `Question`, `Mistake` |
| **Coding Sandbox** | Safe source code execution, test-case verification, execution quota enforcement | `Problem`, `Submission`, `TestCase` |
| **AI Intelligence & RAG** | AI tutor chat, contextual vector embeddings, prompt templating, cost governance | `AIConversation`, `AIMessage`, `VectorChunk` |
| **Governance & Operations** | Immutable audit logs, platform settings, health checks, data quality diagnostics | `AuditLog`, `PlatformSetting`, `FeatureFlag`, `SupportTicket` |

---

## 3. Data Protection & Security Controls
1. **NoSQL Injection Defense**: Recursive sanitization middleware strips MongoDB query operators (`$`, `.`) from client request bodies and query parameters.
2. **Mass Assignment Prevention**: Middleware strips privileged attributes (`role`, `permissions`, `isSuperAdmin`, `publishedBy`, `resetPasswordToken`) from mutating requests sent by non-administrators.
3. **IDOR Defense**: All mutating and sensitive reads verify server-side resource ownership via `requireCourseOwnership` and `requireStudentResourceOwnership`.
4. **Tenant Isolation**: Multi-tenant organizations enforce strict boundaries on jobs, cohorts, reports, and administrative data sets.
5. **CORS & Headers**: Strict CORS origin whitelisting paired with Helmet CSP, HSTS, frameguard (`DENY`), and cross-origin resource policies.

---

## 4. Resilience, Observability & Fault Tolerance
1. **Graceful Shutdown**: Server captures `SIGINT` and `SIGTERM`, halts HTTP listeners, allows in-flight safe requests up to 10 seconds to finish, and closes MongoDB connections cleanly.
2. **Probes**:
   - `/health`: Fast liveness verification for orchestrators.
   - `/ready`: Verifies database readiness (MongoDB connection state `1`). Returns HTTP 503 if disconnected.
   - `/metrics`: System metrics (request count, status distributions, latency snapshots).
3. **Structured Logging**: Unified request log containing timestamp, `requestId`, HTTP method, route, duration, status, and client IP hash. Sensitive secrets and passwords are completely excluded from logs.
