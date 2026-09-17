# Production System Architecture

## 1. High-Level Topology

The platform operates as a modern distributed system consisting of three frontend Next.js applications and a centralized Express.js REST API service, backed by MongoDB and supporting external execution, AI, and caching services.

```
                      INTERNET / USER TRAFFIC
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[student.example.com]   [instructor.example.com]    [admin.example.com]
 Next.js (Port 3000)      Next.js (Port 3001)       Next.js (Port 3002)
 Student Learning        Instructor Studio         Admin Governance
     │                           │                           │
     └───────────────────────────┼───────────────────────────┘
                                 │ HTTPS (CORS Whitelisted)
                                 ▼
                    [api.example.com / Port 5000]
                     Central Express API Gateway
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    [Middlewares]           [API Routes]           [Controllers]
  Helmet, RateLimit,      /api/v1/auth,           Validation,
  Sanitize, RequestID,    /courses, /practice,    Authentication,
  CORS, StructuredLogs    /ai, /admin, /health    Error Normalization
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                       [Service Layer (Domain)]
     ┌───────────────┬───────────┴───────────┬───────────────┐
     ▼               ▼                       ▼               ▼
 [MongoDB Atlas]  [Redis Cache]         [AI Provider]  [Judge0 Sandbox]
 Replica Set      Catalog/Health        Gemini/OpenAI  Isolated Worker
 Pooled Conns     TTL 5m - 1h           Mock Fallback  CPU/RAM Capped
```

---

## 2. Workspace & Monorepo Structure

The monorepo uses npm workspaces without unnecessary complexity:

```
LMS/
├── apps/
│   ├── student/       # Next.js 14 Student Learning Portal
│   ├── instructor/    # Next.js 14 Course Builder & Analytics Studio
│   ├── admin/         # Next.js 14 Admin Governance Console
│   └── backend/       # Express.js REST API & Business Logic
├── packages/
│   └── shared/        # Shared enums (ROLES, STATUSES, API formatters)
├── docs/              # Production architectural & security docs
├── .github/           # CI/CD workflows
└── package.json       # Monorepo root configuration
```

---

## 3. Core Architectural Subsystems

### 3.1 Authentication & RBAC
- **Token Architecture**: Short-lived JWT Access Tokens (15m) paired with database-backed, rotating Refresh Tokens (7d) stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Role Hierarchy**: `STUDENT` < `INSTRUCTOR` < `ADMIN` < `SUPER_ADMIN`.
- **Ownership Middleware**: Instructors can only view/modify their own courses, modules, lessons, and draft test cases.

### 3.2 Code Execution Isolation & Sandbox Security
- **Untrusted Code Execution**: User code is NEVER executed inside the main Node.js API process.
- **Worker Sandboxing**: Execution is dispatched to containerized, resource-constrained runner workers.
- **Safety Limits**:
  - Maximum Execution Time: 2000ms – 5000ms.
  - Memory Ceiling: 128MB – 256MB.
  - Output Cap: 50KB stdout/stderr truncation.
- **Hidden Test Secrecy**: Hidden test inputs, expected values, and detailed assertions are scrubbed before student responses are returned.

### 3.3 AI Tutoring & Authoring Engine
- **Provider Abstraction**: Unified AI service supporting Google Gemini (`gemini-1.5-flash`), OpenAI, or deterministic mock modes.
- **Context Grounding (RAG)**: Course and lesson transcripts chunked and indexed into vector chunks to augment tutor responses.
- **Cost & Abuse Protection**: Stricter token limits (max 2048 tokens), 30 req/min rate limiters, and graceful fallback messages when providers experience outages.

### 3.4 Database & Persistence
- **Engine**: MongoDB with Mongoose ODM.
- **Connection Pooling**: Configured with `minPoolSize=5`, `maxPoolSize=50`, and 45s socket timeouts.
- **Index Optimization**: Compound indexes tailored for catalog search, enrollment uniqueness, student submissions, and administrative audit logging.

### 3.5 Observability, Health Probes & Graceful Shutdown
- **Health Probes**:
  - `GET /health` and `GET /api/v1/health`: Basic application responsiveness.
  - `GET /ready` and `GET /api/v1/health/ready`: Backing database connection readiness.
  - `GET /live` and `GET /api/v1/health/live`: Process uptime and memory telemetry.
- **Tracing**: Every inbound request is assigned or inherits an `X-Request-ID` header.
- **Graceful Shutdown**: Intercepts `SIGINT` / `SIGTERM`, flushes HTTP server connections, safely disconnects MongoDB, and times out after 10s if dangling connections remain.
