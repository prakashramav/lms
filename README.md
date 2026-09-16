# AI-Powered Career Learning + Coding + Interview Platform

A production-grade, full-stack EdTech and career engineering platform built with an independently deployable micro-frontend / monorepo architecture.

## Platform Architecture

- **`apps/student`**: Student Learning Platform (`http://localhost:3000`)
- **`apps/instructor`**: Instructor Curriculum Studio (`http://localhost:3001`)
- **`apps/admin`**: Platform Governance Console (`http://localhost:3002`)
- **`apps/backend`**: Express REST API (`http://localhost:5000`)
- **`packages/shared`**: Shared constants, role definitions, and response utilities
- **`docs/`**: Full architectural, authentication, security, and API specifications

---

## Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **npm**: v9+ (tested on npm v11)
- **MongoDB**: Local MongoDB or MongoDB Atlas URI (configured in `.env`)

### 1. Installation
Install all dependencies across the monorepo:
```bash
npm install
```

### 2. Environment Setup
Copy the example environment template:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### 3. Seed Development Accounts
Seed sample student, instructor, and admin accounts into the database:
```bash
npm run seed
```

#### Development Seed Accounts (Local Development Only)
| Portal | Role | Email | Password | Access URL |
|---|---|---|---|---|
| **Student** | `STUDENT` | `student@example.com` | `StudentPass123!` | http://localhost:3000/login |
| **Instructor** | `INSTRUCTOR` | `instructor@example.com` | `InstructorPass123!` | http://localhost:3001/login |
| **Admin** | `ADMIN` | `admin@example.com` | `AdminPass123!` | http://localhost:3002/login |

---

## Running Applications

You can run individual applications or all services concurrently.

#### Run All Services Concurrently
```bash
npm run dev
```

#### Run Applications Individually
```bash
# Backend REST API (Port 5000)
npm run dev:backend

# Student Application (Port 3000)
npm run dev:student

# Instructor Application (Port 3001)
npm run dev:instructor

# Admin Application (Port 3002)
npm run dev:admin
```

---

## Verification & Testing

### Running Tests
Execute unit and API integration tests:
```bash
npm test
# Or backend-specific
npm run test:backend
```

### Running Linter
Check code quality across all workspaces:
```bash
npm run lint
```

### Running Production Builds
Compile all applications for production:
```bash
npm run build
```

---

## Documentation Index
- [Architecture Overview](docs/architecture.md)
- [Authentication & RBAC](docs/authentication.md)
- [Platform Security Specification](docs/security.md)
- [Course Architecture & Data Models](docs/courses.md)
- [Learning Management System (LMS)](docs/learning-system.md)
- [Progress Tracking & Enrollment System](docs/progress.md)
- [Assessment & Quiz Architecture](docs/assessments.md)
- [Question Engine Specification](docs/question-engine.md)
- [Scoring & Grading Engine](docs/scoring.md)
- [Assessment Security & Anti-Tampering](docs/assessment-security.md)
- [Coding Practice & Online Judge](docs/coding-platform.md)
- [Execution Engine & Pipeline](docs/execution-engine.md)
- [Sandbox Security & Threat Containment](docs/sandbox-security.md)
- [Language Runners & Adapters](docs/language-runners.md)
- [Test Case Engine & Normalization](docs/test-case-engine.md)
- [Submission Engine & Scoring](docs/submissions.md)
- [Student Dashboard Specification](docs/student-dashboard.md)
- [API v1 Specification](docs/api.md)
- [Environment Configuration](docs/environment.md)
