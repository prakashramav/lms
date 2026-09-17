# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-17 - Final Production Launch

### Production Architecture & Platform Envelope
- **Unified Monorepo Architecture**: Student application (port 3000), Instructor application (port 3001), Admin application (port 3002), and REST API Backend (port 5000) operating on a shared package layer.
- **Environment Strategy**: Explicit configuration separation across `.env.local.example`, `.env.test.example`, `.env.staging.example`, and `.env.production.example`. Strict fail-fast production startup validation without leaking secret values.
- **Centralized Configuration**: All system constants, limits, database pooling settings, security parameters, and error codes consolidated into `apps/backend/src/config/`.

### Security Hardening
- **RBAC & Granular Permissions**: Multi-tier role-based access control protecting Student, Instructor, Admin, and Super Admin domains with audit logging on sensitive operations.
- **SSRF Prevention**: Strict outbound URL validation preventing access to AWS metadata endpoints (169.254.169.254), private RFC 1918 subnets, and loopback addresses.
- **NoSQL Injection & Mass Assignment Defense**: Recursive request body sanitization stripping dangerous MongoDB operators (`$ne`, `$gt`, `$where`, regex patterns).
- **Code Execution Sandbox Isolation**: Secure runner with 5-second execution limits, 128MB memory caps, output truncation, and disabled external network access.
- **Audit Log Immutability**: Tamper-resistant audit trails with pre-save and pre-update guards preventing modification or deletion.

### Database Hardening & Performance
- **Connection Resilience**: MongoDB connection pooling (`maxPoolSize: 50`), socket timeouts (45s), server selection timeouts, and exponential retry backoff.
- **Compound Index Audit**: Optimized multi-field compound indexes added across `User`, `Course`, `Job`, `JobApplication`, `Resume`, `Portfolio`, `InterviewSession`, and `AuditLog`.
- **Slow Query Detection**: Automated Mongoose plugin monitoring all read and write queries, logging warnings for executions exceeding 150ms without recording sensitive filter parameters.

### Observability & Health Probes
- **Health Probes**: Standardized `GET /health`, `GET /ready` (backing database probe), and `GET /live` (lightweight process supervision) endpoints.
- **Structured JSON Logging**: Centralized request logger recording timestamp, level, method, route, status code, latency, and request ID.

### Containerization & CI/CD
- **Docker Production Image**: Multi-stage, minimal Alpine-based container running under an unprivileged `edtechuser` (UID 1001).
- **Docker Compose**: Orchestration service including MongoDB 7.0, Redis 7.2-alpine, and API server with automated health probes.
- **Automated Testing & Gates**: Full suite of unit, integration, security audit (`test:security`), and performance tests (`test:performance`) running 218 tests with 100% pass rate.
