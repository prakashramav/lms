# Enterprise Horizontal Scaling & Capacity Strategy

## 1. Overview
ApexLearn achieves scalability by maintaining a **stateless backend API tier**, offloading static/media assets to an Edge CDN and Object Storage, and decoupling background workloads via Redis-backed job queues.

---

## 2. Tier-by-Tier Scaling Model

```mermaid
graph TD
    subgraph Ingress ["Edge & Load Balancer Tier"]
        LB["Application Load Balancer / Ingress Controller"]
    end

    subgraph StatelessFleet ["Stateless Backend Fleet (Auto-Scaled)"]
        API1["Express Node Instance 1"]
        API2["Express Node Instance 2"]
        APIN["Express Node Instance N"]
    end

    subgraph WorkerFleet ["Worker Fleet (Auto-Scaled independently)"]
        W1["BullMQ Worker 1 (Email / Notifs)"]
        W2["BullMQ Worker 2 (Certificates / AI)"]
        WN["BullMQ Worker N"]
    end

    subgraph DistributedState ["Distributed Cache & Messaging"]
        REDIS["Redis Cluster (v7.2)<br/>- Public Catalog Cache<br/>- Rate Limit Buckets<br/>- Concurrency Locks"]
    end

    subgraph DatabaseTier ["Persistence Tier"]
        MONGO_PRI[("MongoDB Primary Node")]
        MONGO_SEC1[("MongoDB Secondary Replica 1")]
        MONGO_SEC2[("MongoDB Secondary Replica 2")]
    end

    subgraph ObjectStorage ["Media & Object Tier"]
        S3["Cloud Object Storage (S3 / Cloudinary)"]
        CDN["Global Edge CDN"]
    end

    LB --> API1
    LB --> API2
    LB --> APIN

    API1 --> REDIS
    API2 --> REDIS
    APIN --> REDIS

    API1 --> MONGO_PRI
    API2 --> MONGO_PRI
    APIN --> MONGO_PRI

    REDIS --> W1
    REDIS --> W2
    REDIS --> WN

    W1 --> MONGO_PRI
    W2 --> MONGO_PRI
    WN --> MONGO_PRI

    MONGO_PRI -.-> MONGO_SEC1
    MONGO_PRI -.-> MONGO_SEC2

    API1 --> S3
    S3 --> CDN
```

---

## 3. Stateless Backend Scaling Rules

1. **Zero Local File Dependency**: No session state, uploaded files, or transient caches are stored on the local file system. All uploaded artifacts are piped directly to Object Storage.
2. **Stateless JWT & Refresh Tokens**: Authentication state is validated via cryptographic signatures and database/Redis refresh token lookups.
3. **Auto-Scaling Metrics**:
   - **Scale Out**: CPU utilization > 70% OR HTTP request queue latency > 200ms over a 3-minute sustained window.
   - **Scale In**: CPU utilization < 25% over a 15-minute cooldown period.

---

## 4. Redis Caching & Eviction Policies

| Cache Domain | Key Pattern | TTL | Eviction Policy | Security Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **Public Course Metadata** | `cache:course:public:<courseId>` | 30 Minutes | `volatile-lru` | Public catalog only |
| **Course Category Summary** | `cache:courses:categories` | 1 Hour | `volatile-lru` | Public metadata |
| **Rate Limit Counters** | `ratelimit:<tier>:<ip_or_user>` | 1 Minute - 15m | `volatile-ttl` | Transient bucket |
| **Session Concurrency Lock**| `lock:session:mentor:<slotId>` | 30 Seconds | `volatile-ttl` | Concurrency lock |

> [!CAUTION]
> **Strict Privacy Rule**: Never cache private student submissions, grades, resumes, direct messages, or multi-tenant enterprise data in global Redis keys.

---

## 5. Background Worker Scaling

1. **Independent Process Isolation**: Background workers run in separate container pods from user-facing HTTP request listeners.
2. **Queue Backlog Scaling**: Worker instances scale based on BullMQ backlog count (1 worker per 500 queued jobs).
3. **Graceful Job Shutdown**: Workers listen for `SIGTERM`, cease picking up new jobs, and allow active jobs up to 45 seconds to finish before graceful termination.

---

## 6. Database Scaling & Read Splitting

1. **Read Preference**: Read operations on non-critical historical queries (e.g. analytics aggregates, past course reviews) utilize `readPreference: 'secondaryPreferred'`.
2. **Write Integrity**: All state modifications, enrollments, payments, and assessment submissions strictly target the Primary node (`w: 'majority'`).
3. **Connection Ceiling**: Each container maintains `maxPoolSize: 50`. Total cluster connection capacity = `(Max Containers * 50) < MongoDB Max Allowed Sockets`.
