# Enterprise Scale & Platform Extensibility Architecture

## 1. Modular Monolith Architecture
The platform intentionally employs a **Modular Monolith** architecture over premature microservices. This provides enterprise-grade scalability, simple continuous delivery, zero network latency overhead between domain services, and bulletproof transactional integrity.

```mermaid
flowchart TD
    subgraph ClientPortals ["Client Applications (Next.js 14)"]
        StudentPortal["Student Portal (:3000)"]
        InstructorStudio["Instructor Studio (:3001)"]
        AdminConsole["Admin Console (:3002)"]
        EmployerPortal["Employer ATS Workflows"]
    end

    subgraph APIIngress ["API Gateway (:5000)"]
        IngressRouter["Express API Gateway"]
        AuthLayer["Auth & Session Guard"]
        TenantGuard["Tenant & IDOR Context Resolver"]
        Idemp["Idempotency & Rate Limit Store"]
    end

    subgraph ModularServices ["Domain Service Boundaries"]
        LearningSvc["Learning & Curriculum Domain"]
        IntelSvc["Intelligence & Skill Graph Domain"]
        CareerSvc["Career, Resume & ATS Pipeline"]
        GovSvc["Governance, Audit & Quality Scanner"]
        JobWorker["Asynchronous Job & DLQ Worker"]
    end

    subgraph StorageInfra ["Persistence & Cache"]
        MongoDB[("MongoDB 7.0 (Compound Indexes)")]
        RedisCache[("Redis (Distributed Sessions & Limiters)")]
    end

    ClientPortals --> IngressRouter
    IngressRouter --> AuthLayer
    AuthLayer --> TenantGuard
    TenantGuard --> Idemp
    Idemp --> ModularServices
    ModularServices --> StorageInfra
```

---

## 2. Horizontal Scaling & Stateless API Gateway
1. **Stateless HTTP Layer**: Sessions are anchored in short-lived cryptographic JWTs and Redis distributed session stores. Any backend instance can handle any client request behind a standard Layer 7 load balancer (Nginx / AWS ALB).
2. **Distributed Rate Limiting**: Tiered rate limiters utilize Redis key expiration for shared token buckets across multi-instance clusters.
3. **Database Connection Pooling**: Mongoose connection pooling is tuned with `maxPoolSize: 50` and automatic connection reuse, avoiding per-request connection overhead.

---

## 3. Asynchronous Job Processing & Dead Letter Queues
- Long-running tasks (curriculum report generation, cohort velocity re-indexing, AI evaluations, email dispatches) are offloaded to background job processors.
- Jobs implement bounded exponential backoff (maximum 3 retries). Poison pill tasks automatically transition to the Dead Letter Queue (DLQ) for administrative triage.
