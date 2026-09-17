# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-17 - Phase 15 Production Scale, Advanced AI & Reliability

### Added
- **API Reliability & Idempotency**:
  - Standardized error envelopes with `{ success: false, error: { code, message, details } }`.
  - `idempotency.middleware.js`: Deduplication and caching of state-mutating requests via `Idempotency-Key`.
  - Global `GET /metrics` telemetry endpoint tracking latency percentiles, error rates, and queue health.
- **Background Job Queue & Dead Letter Queue (DLQ)**:
  - `jobQueue.js`: Asynchronous job execution with states (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETRYING`, `CANCELLED`).
  - Bounded exponential retries (max 3) with Dead Letter Queue preservation and admin triage routes (`/api/v1/queue/status`, `/api/v1/queue/dlq/:jobId/retry`, `/api/v1/queue/jobs/:jobId/cancel`).
- **Resilient AI Router & Circuit Breaker**:
  - `aiRouter.js`: Multi-provider fallback chain (Primary -> Secondary -> Resilient Mock).
  - 3-strike circuit breaker with cooldown timer to prevent cascading failures.
  - Deterministic prompt request caching and tiered quota rate enforcement.
  - `aiEvaluator.js`: Golden dataset evaluation and prompt injection safety regression suite.
- **Resource-Level Authorization & IDOR Hardening**:
  - `resourceAuth.middleware.js`: Granular verification of resource ownership preventing cross-user, cross-course, and cross-organization tampering.
  - `Organization` model supporting multi-tenant institutional and employer teams with role-based memberships.
- **Automated Disaster Recovery & Backups**:
  - `scripts/backup.js`: Checksum-verified JSON snapshot generator for core database collections.
  - `scripts/restore.js`: Automated restoration engine with round-trip verification tested.

## [1.1.0] - 2026-09-17 - Phase 14 Advanced Intelligence, Personalization & Ecosystem

### Added
- **Centralized Personalization Service (`services/personalization/`)**:
  - `studentProfileService.js`: Dynamic multi-dimensional student profile synthesizing course velocity, skill mastery levels, weak topics, and career intents.
  - `learningRecommendationService.js`: Smart "Continue Learning" engine with adaptive remediation for prerequisite weaknesses and explainable `reasonCodes`.
  - `careerRecommendationService.js`: Transparent skill gap analysis against 9+ core roles and 5-phase structured roadmaps.
  - `contentRecommendationService.js`: Dynamic project, course, and practice recommendations with transparent explanation metadata.
  - `engagementService.js`: Structured weekly progress reports and multi-metric learning streak tracking.
- **Skill Graph & Mastery Calibrations**:
  - Differentiated mastery dimensions: `observedScore`, `selfReportedLevel`, `assessmentBasedLevel`, and `aiEstimatedLevel`.
  - `SkillRelationship` model establishing prerequisites and related competencies.
- **AI Learning Coach (`aiCoach.service.js`)**:
  - Context-isolated coaching across 7 modes: `EXPLAIN`, `PRACTICE`, `REVIEW`, `PLAN`, `DEBUG`, `INTERVIEW`, `CAREER`.
- **Verifiable Certificate Credentialing (`certificate.model.js`)**:
  - Cryptographically identifiable certificates generated strictly upon validated completion.
  - Public verification route: `/verify/certificate/:id` and API endpoint `GET /api/v1/certificates/verify/:id`.
- **Student Support Helpdesk & AI Classifier (`supportTicket.model.js`)**:
  - Threaded helpdesk ticketing across Technical, Course Content, Account, Career, and Billing domains.
  - Intelligent categorization and urgency estimation via `aiSupportClassifier.js`.
- **Project Showcase & Community (`projectShowcase.model.js`)**:
  - Dedicated showcase interface allowing students to publish portfolio projects with GitHub and demo links.
- **Employer ATS Kanban Board (`employerIntelligence.js`)**:
  - Multi-stage candidate management pipeline (`APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `ASSESSMENT`, `OFFER`, `REJECTED`, `WITHDRAWN`).
  - Audited stage transitions logged to `AuditLog`.
- **Admin Intelligence & Aggregated Analytics (`adminIntelligenceExtended.js`)**:
  - Safe materialized conversion funnels, cohort retention tracking, and AI token/latency telemetry.

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
