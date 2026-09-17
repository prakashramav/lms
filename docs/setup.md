# System Setup & Developer Guide

## 1. Prerequisites
- **Node.js**: v20.x or higher (LTS recommended)
- **npm**: v10.x or higher
- **MongoDB**: v6.0+ (or use Docker / dynamic in-memory test runner)
- **Redis**: v7.0+ (optional for local dev, mock fallback active)

---

## 2. Quickstart (One-Command Development)

1. Clone the repository and install all workspace dependencies:
```bash
git clone <repository-url>
cd LMS
npm install
```

2. Copy environment templates:
```bash
cp .env.local.example .env
```

3. Launch all services concurrently (Backend + Student + Instructor + Admin):
```bash
npm run dev
```

The application entry points will be accessible at:
- **Backend API**: `http://localhost:5000`
- **Student App**: `http://localhost:3000`
- **Instructor App**: `http://localhost:3001`
- **Admin App**: `http://localhost:3002`

---

## 3. Containerized Setup (Docker Compose)

To run the complete platform including MongoDB 7 and Redis using Docker:

```bash
docker compose up -d --build
```

Verify service health:
```bash
docker compose ps
curl http://localhost:5000/health
curl http://localhost:5000/ready
```

To stop containers:
```bash
docker compose down
```

---

## 4. Test Execution

The platform provides a unified suite of test commands:

```bash
# Run all 16 test suites (218 tests)
npm run test:all

# Run security test suite (Sandbox + SSRF + Injection + RBAC)
npm run test:security

# Run latency and performance benchmark suite
npm run test:performance

# Run linting across all monorepo packages
npm run lint

# Build all applications for production
npm run build
```

---

## 5. Seed Data & Demo Accounts

To populate local MongoDB with seed courses, career paths, jobs, and accounts:
```bash
npm run seed
```

### Development Demo Accounts (NOT FOR PRODUCTION):
| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!` |
| Instructor | `instructor@example.com` | `Instructor123!` |
| Student | `student@example.com` | `Student123!` |
