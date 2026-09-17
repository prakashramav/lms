# ApexLearn — AI-Powered Education, Coding & Career Platform

A production-ready full-stack education platform built with modern web architecture: micro-frontends via Next.js 14 App Router, an Express.js API gateway with layered services, MongoDB Atlas persistence, containerized code execution sandboxing, and pedagogical AI tutoring.

---

## 1. Platform Applications & Domains

| Application | Target Production Domain | Local Port | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Student Portal** | `https://student.example.com` | `http://localhost:3000` | Course discovery, interactive learning, assessment player, sandboxed coding practice, AI Tutor, progress telemetry |
| **Instructor Studio** | `https://instructor.example.com` | `http://localhost:3001` | Course authoring, module/lesson builder, question bank, coding problem creation, cohort analytics |
| **Admin Console** | `https://admin.example.com` | `http://localhost:3002` | Platform governance, user approvals, course review/publishing, content moderation, audit logs, system telemetry |
| **Backend REST API** | `https://api.example.com` | `http://localhost:5000` | REST API (`/api/v1`), RBAC authorization, sandbox orchestrator, RAG vector indexing, rate limiting, health probes |

---

## 2. Architecture Overview

```
                      INTERNET / INBOUND TRAFFIC
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[student.example.com]   [instructor.example.com]    [admin.example.com]
 Next.js 14 Portal        Next.js 14 Studio         Next.js 14 Console
     │                           │                           │
     └───────────────────────────┼───────────────────────────┘
                                 │ HTTPS (CORS Strict Allowlist)
                                 ▼
                    [api.example.com / Port 5000]
                     Express REST API Gateway
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

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Monaco Code Editor, Lucide Icons
- **Backend API**: Node.js, Express.js 4, Mongoose 8 ODM
- **Database**: MongoDB (Replica set support, compound indexes, connection pooling)
- **Cache & Queue**: Redis (TTL-based catalog caching and execution queue)
- **Execution Sandbox**: Judge0 / Isolated container runner with CPU & memory caps
- **AI Tutoring**: Google Gemini (`gemini-1.5-flash`), OpenAI, with intelligent deterministic mock fallback
- **Security**: Helmet, bcrypt (10 salt rounds), JWT access + HttpOnly refresh cookies, NoSQL injection sanitization, Mass assignment protection, tiered rate limiters

---

## 4. Local Development & Setup

### Prerequisites
- **Node.js**: v18.0+ or v20+
- **npm**: v9.0+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI

### Step 1: Clone & Install Dependencies
```bash
git clone <repository_url>
cd LMS
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Review `.env` and verify `PORT=5000`, `MONGODB_URI`, and token secret keys.

### Step 3: Seed Development Database
Populate essential courses, coding problems, assessments, and sample credentials:
```bash
npm run seed
```

#### Default Development Credentials
| Role | Email | Password | Target App |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.com` | `StudentPass123!` | [Student App](http://localhost:3000/login) |
| **Instructor** | `instructor@example.com` | `InstructorPass123!` | [Instructor App](http://localhost:3001/login) |
| **Admin** | `admin@example.com` | `AdminPass123!` | [Admin App](http://localhost:3002/login) |
| **Super Admin** | `superadmin@example.com` | `SuperAdminPass123!` | [Admin App](http://localhost:3002/login) |

---

## 5. Development & Production Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Start All Applications** | `npm run dev` | Runs backend, student, instructor, and admin concurrently |
| **Start Backend API** | `npm run dev:backend` | Runs nodemon dev server on port 5000 |
| **Start Student App** | `npm run dev:student` | Runs Next.js development server on port 3000 |
| **Start Instructor App** | `npm run dev:instructor` | Runs Next.js development server on port 3001 |
| **Start Admin App** | `npm run dev:admin` | Runs Next.js development server on port 3002 |
| **Run All Tests** | `npm test` | Runs all monorepo test suites |
| **Run Backend Tests** | `npm run test:backend` | Executes Jest test suites across all backend endpoints |
| **Run Linter** | `npm run lint` | Runs ESLint and type checks across all workspaces |
| **Production Build** | `npm run build` | Builds optimized production bundles for all apps |
| **Seed Database** | `npm run seed` | Seeds administrative, instructor, and course records |

---

## 6. Testing & Quality Assurance

The codebase employs a strict testing pyramid:
- **Unit & Service Tests**: Validates scoring math, permission evaluation, and token services.
- **Integration Tests**: Tests database mutations, enrollment flows, course approval state machine, and assessment grading.
- **Production Hardening Tests** (`tests/productionHardening.test.js`):
  - Health (`/health`), readiness (`/ready`), and liveness (`/live`) probes.
  - End-to-end `X-Request-ID` propagation.
  - NoSQL injection stripping ($gt, $ne, $where).
  - Mass assignment privilege escalation prevention.
  - Cross-role RBAC enforcement (Student -> Admin, Instructor -> Admin, Student -> Instructor).
- **Run the test suite**:
```bash
npm run test:backend
```

---

## 7. Security Hardening & Controls

- **Zero Plaintext Secrets**: Passwords hashed with bcrypt; reset tokens hashed and single-use.
- **Hidden Test Secrecy**: Private coding test cases and expected outputs are never returned to student endpoints.
- **Mass Assignment Defense**: Unauthorized fields (`role`, `permissions`, `isSuperAdmin`, `publishedBy`) are stripped from incoming client requests.
- **NoSQL Injection Defense**: Key sanitize middleware removes Mongo query operators from request bodies and query parameters.
- **Tiered Rate Limiting**: Dedicated limiters protect authentication, AI prompts, code executions, and admin mutations.
- **Secure Cookies & CORS**: HttpOnly, SameSite, Secure cookies, and strict domain whitelisting.

---

## 8. Health Probes & Observability

- **`GET /health`** / **`GET /api/v1/health`**: Verifies API process is running.
- **`GET /ready`** / **`GET /api/v1/health/ready`**: Verifies MongoDB database connectivity.
- **`GET /live`** / **`GET /api/v1/health/live`**: Verifies process uptime and runtime health.

---

## 9. Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`Missing required production environment variable: MONGODB_URI`** | Running in production without configuring mandatory database connection string | Ensure `.env` or container environment defines `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` |
| **`Blocked by CORS policy`** | Frontend origin does not match `CORS_ORIGIN` allowlist | Add the requesting frontend domain to `CORS_ORIGIN` in `.env` (comma-separated) |
| **`Port 5000 already in use`** | A dangling Node.js process is holding the port | Run `netstat -ano \| findstr :5000` (Windows) or `lsof -i :5000` (Linux) and terminate PID |
| **`AI service is temporarily unavailable`** | Upstream Gemini or OpenAI API key missing or timed out | Verify `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env`, or switch `AI_PROVIDER=mock` for deterministic local development |
| **`Database connection is unavailable` on `/ready`** | MongoDB service is stopped or network unreachable | Confirm MongoDB is running locally (`mongod`) or check Atlas IP access list allow rules |

---

## 10. Documentation Index

- [Production Architecture Documentation](docs/architecture.md)
- [Production Security & Threat Containment](docs/security.md)
- [Production Deployment & Staging Runbook](docs/deployment.md)
- [Database Architecture & Index Audit](docs/database.md)
- [API v1 REST Specification](docs/api.md)
- [OpenAPI 3.0 YAML Contract](docs/openapi.yaml)
