# Phase 15 Enterprise System Architecture

## 1. Overview
The platform employs a modular, scalable architecture separating client interfaces, RESTful API gateways, resilient AI routing layers, background job queues, and hardened persistent storage.

```mermaid
graph TD
    User([End Users: Students, Instructors, Employers, Admins])
    CDN[Edge CDN / Reverse Proxy / SSL Termination]
    
    subgraph Frontend Applications
        StudentApp[Student Next.js App - Port 3000]
        InstructorApp[Instructor Next.js App - Port 3001]
        AdminApp[Admin Next.js App - Port 3002]
        EmployerApp[Employer Workflows]
    end

    subgraph Backend Core API Gateway - Port 5000
        Router[API Gateway & Rate Limiters]
        Auth[Auth & RBAC Middleware]
        Idemp[Idempotency Guard]
        ResAuth[Resource-Level IDOR Guard]
        Obs[Observability & Metrics /metrics]
    end

    subgraph Service & Worker Layer
        AIRouter[Resilient AI Router & Circuit Breaker]
        Queue[Background Job Queue & DLQ]
        Worker[Background Worker Process]
    end

    subgraph Persistence & Caching
        Mongo[(MongoDB 7.0 Primary Database)]
        RedisCache[(Redis Cache / Rate Limit Store)]
        Storage[(Local / S3 Object Storage)]
    end

    User --> CDN
    CDN --> StudentApp
    CDN --> InstructorApp
    CDN --> AdminApp
    CDN --> EmployerApp

    StudentApp --> Router
    InstructorApp --> Router
    AdminApp --> Router
    EmployerApp --> Router

    Router --> Auth
    Auth --> Idemp
    Idemp --> ResAuth
    ResAuth --> Obs

    ResAuth --> AIRouter
    ResAuth --> Queue
    Queue --> Worker

    ResAuth --> Mongo
    ResAuth --> RedisCache
    ResAuth --> Storage
```

## 2. Component Breakdown
- **Edge Layer**: SSL termination, DDoS protection, static caching of Next.js static assets.
- **Frontend Applications**: Next.js 14 App Router, Tailwind CSS, responsive accessible components.
- **Core API Gateway**:
  - `x-request-id` propagation across all controllers and logs.
  - Tiered rate limiters: General, Auth, AI, Coding Sandbox, Admin.
  - Idempotency middleware caching responses for mutating operations.
- **Resilient AI Layer**:
  - `aiRouter.js` managing fallback chains (Primary Provider -> Secondary Provider -> Resilient Mock).
  - 3-strike circuit breaker with cooldown timer to prevent cascading failures.
  - Tiered quota enforcement (`FREE`: 20/hr, `STANDARD`: 100/hr, `PREMIUM`: 500/hr, `ENTERPRISE`: 2000/hr).
- **Background Worker & DLQ**:
  - Asynchronous execution of heavy tasks (report generation, recommendation recalculation, bulk email dispatch).
  - Bounded exponential retries (max 3) with Dead Letter Queue preservation for operational triage.
