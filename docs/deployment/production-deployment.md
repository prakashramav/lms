# Production Deployment Runbook & Strategy

## 1. Overview & Deployment Topologies

ApexLearn utilizes a decoupled micro-frontend and modular monolith backend deployment model:

| Application | Target Host / Service | Port | Base Path / Domain |
| :--- | :--- | :--- | :--- |
| **Student Application** | Vercel / Node.js Container | 3000 | `https://student.example.com` |
| **Instructor Studio** | Vercel / Node.js Container | 3001 | `https://instructor.example.com` |
| **Admin Console** | Vercel / Node.js Container | 3002 | `https://admin.example.com` |
| **Backend API Gateway** | AWS ECS / DigitalOcean K8s | 5000 | `https://api.example.com/api/v1` |
| **Background Workers** | Dedicated Node.js Worker Pods| N/A | In-memory / Redis BullMQ Consumer |

---

## 2. Pre-Deployment Validation Checklist

Before initiating any staging or production deployment:
1. [ ] **Branch Sync**: Target release branch is merged from validated `develop` or release branch.
2. [ ] **Test Coverage**: All 26 backend test suites (266 tests) pass with a 100% pass rate.
3. [ ] **Lint & Build**: `npm run lint` and `npm run build` succeed across all workspaces with zero blocking errors.
4. [ ] **Environment Audit**: No secrets committed to source; production secrets confirmed present in secret manager.
5. [ ] **Database Backward Compatibility**: Any schema alterations follow the expand-contract pattern (no breaking renames).

---

## 3. Deployment Phases (Blue-Green / Rolling)

### Phase 1: Database Migration (Pre-Deploy)
1. Apply additive schema migrations (new collections, non-blocking compound indexes via `{ background: true }`).
2. Verify existing running backend instances continue functioning with new schemas.

### Phase 2: Backend Container Rollout (Rolling Update)
1. Deploy new backend container tasks behind the Application Load Balancer.
2. Orchestrator issues health check probes against `GET /health` and `GET /ready`.
3. Only tasks returning `200 OK` on `/ready` (confirming MongoDB connection) receive incoming traffic.
4. Old backend tasks are deregistered gracefully, waiting up to 30 seconds for in-flight requests to complete.

### Phase 3: Background Worker Upgrade
1. Stop worker queues from pulling new tasks.
2. Allow active worker jobs up to 45 seconds to finish or persist state.
3. Terminate old worker instances and start new worker containers pointing to the shared Redis/Mongo instances.

### Phase 4: Frontend Rollout (Static Assets & SSR)
1. Build Next.js production bundles for Student, Instructor, and Admin apps.
2. Upload immutable static assets (`/_next/static/*`) to CDN with permanent cache headers (`Cache-Control: public, max-age=31536000, immutable`).
3. Deploy new Next.js server instances.
4. Purge HTML and dynamic cache at Edge CDN.

---

## 4. Post-Deployment Verification (Smoke Testing)

Immediately run non-destructive read probes:
```bash
# 1. Verify API Health, Readiness, and Liveness
curl -fsS https://api.example.com/health
curl -fsS https://api.example.com/ready
curl -fsS https://api.example.com/live

# 2. Verify Telemetry & Observability
curl -fsS https://api.example.com/metrics

# 3. Verify Public Catalog Read
curl -fsS https://api.example.com/api/v1/courses?limit=1

# 4. Verify Frontend HTTP Headers (HSTS, CSP, X-Frame-Options)
curl -I https://student.example.com
curl -I https://instructor.example.com
curl -I https://admin.example.com
```

---

## 5. Deployment Failure & Abort Criteria
Halt deployment and initiate immediate rollback if:
- API error rate exceeds **1%** over a 5-minute rolling window.
- Database `/ready` probe returns `503 Service Unavailable`.
- 95th percentile latency ($p95$) spikes above **500ms** on core read endpoints.
- Any critical security header (CSP, HSTS) fails verification.
