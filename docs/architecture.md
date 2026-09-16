# System Architecture Documentation

## 1. High-Level Architecture

The platform is designed as an enterprise-grade monorepo where each frontend and the backend API are standalone, independently deployable artifacts.

```
┌─────────────────────────────────┐
│         STUDENT APP             │
│   Next.js (Port 3000)           │
│   student.example.com           │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│       INSTRUCTOR APP            │
│   Next.js (Port 3001)           │
│   instructor.example.com        │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│          ADMIN APP              │
│   Next.js (Port 3002)           │
│   admin.example.com             │
└───────────────┬─────────────────┘
                │
                │ HTTP REST / JSON
                ▼
┌─────────────────────────────────┐
│          EXPRESS API            │
│   Node.js (Port 5000)           │
│   api.example.com               │
└───────────────┬─────────────────┘
                │
      ┌─────────┼──────────┬──────────────┐
      │         │          │              │
      ▼         ▼          ▼              ▼
  MongoDB     Redis    AI Engine   Judge0 Execution
 (Database)  (Cache)  (Gemini/OA)     (Sandbox)
```

## 2. Monorepo Organization

- **`apps/student`**: Learner facing application (Next.js 14, App Router, JavaScript, Tailwind CSS).
- **`apps/instructor`**: Course authoring, sandbox configuration, cohort analytics.
- **`apps/admin`**: Governance, RBAC enforcement, billing, audit logging.
- **`apps/backend`**: Modular Express REST API layer with Mongoose ODM.
- **`packages/shared`**: Cross-cutting data contracts, roles, status enums, response formats.
- **`docs/`**: Engineering guidelines, API specifications, environment configurations.

## 3. Communication Protocols

- **Client-to-API**: Authenticated REST API (`/api/v1`) using JSON payloads.
- **Sandbox Isolation**: The backend delegates all untrusted code execution to an isolated runner worker (Judge0/Docker sandbox) with memory, CPU, and network boundaries. Untrusted code is NEVER executed on the application server.
