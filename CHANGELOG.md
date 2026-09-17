# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-09-18 - Phase 19 Post-Launch Intelligence, Optimization & Continuous Improvement

### Added
- **Product Analytics & Event Ingestion Architecture**:
  - `docs/analytics/analytics-architecture.md`: Standardized `v1` event schema covering Learning, Assessment, Coding, Career, Instructor, Admin, and AI Telemetry.
  - Privacy-compliant event pipeline with deduplication safeguards and zero PII/secret logging.
- **AI Continuous Evaluation & Safety Regression Framework**:
  - `docs/ai/evaluation.md`: Version-controlled golden dataset evaluation framework (`aiEvaluator.js`) testing concept explanations, prompt injection defense, code debugging, and diagnostics.
- **Safe Experimentation & Feature Flag Lifecycle**:
  - `docs/experimentation/feature-flags.md`: Formalized feature flag governance across draft, canary, GA, and emergency kill switches.
- **Standardized Product Metrics Dictionary**:
  - `docs/product/metrics.md`: Normalized metrics dictionary ensuring identical definitions across Student, Instructor, and Admin reporting views.
- **Phase 19 Launch Intelligence Validation**:
  - `docs/releases/phase-19-validation.md`: Comprehensive post-launch intelligence report confirming zero fabricated analytics.

---

## [1.4.0] - 2026-09-17 - Phase 17 Production Hardening, Security, Scalability & Launch Readiness

### Added
- **Frontend App Router Resiliency & Error Boundaries**:
  - `error.jsx` and `not-found.jsx` implemented across all 3 portals (`apps/student`, `apps/instructor`, `apps/admin`).
  - Safe recovery UX with interactive retry triggers, error digest logging, and direct links back to dashboards without blank screens.
- **Database Index Optimization**:
  - Compound indexing on `Course` (`{ isPublished: 1, status: 1, category: 1 }`, `{ instructor: 1, status: 1 }`).
  - Compound indexing on `Enrollment` (`{ studentId: 1, status: 1 }`, `{ courseId: 1, status: 1 }`).
  - Whitelisted sorting parameters and maximum page size limits preventing unbounded resource reads.
- **Operational Runbooks & Incident Response**:
  - `docs/operations/disaster-recovery.md`: RPO <= 1h, RTO <= 30m recovery procedures for MongoDB, AI providers, and cloud storage.
  - `docs/operations/incident-response.md`: Severity triage protocol (P0-P3), mitigation lead workflows, and blameless postmortem templates.
  - `docs/operations/deployment-runbook.md`: Production startup commands, Windows PowerShell scripts, zero-downtime rolling deployment guidelines, and rollback procedures.
- **Security Architecture & Test Reports**:
  - `docs/security/security-model.md`: Full architecture documentation covering JWT session handling, RBAC, IDOR guards, and NoSQL sanitization.
  - `docs/security/security-test-report.md`: Automated security verification covering OWASP Top 10 mitigation strategies.
  - `docs/testing/final-test-matrix.md`: Matrix covering all 26 test suites and 266 passing integration tests.
  - `docs/production-readiness-report.md`: Production readiness assessment scorecard.
  - `docs/risk-register.md`: Comprehensive operational risk register with owners and mitigation status.
- **API Inventory & Topology**:
  - `docs/api/api-inventory.md`: Exhaustive catalog of all endpoints across 25+ route modules with auth, roles, and rate limits.
  - `docs/architecture/system-architecture.md`: Updated end-to-end mermaid topology showing multi-app frontend, Express API Gateway, AI router with circuit breakers, background workers, and MongoDB/Redis persistence.

---

## [1.3.0] - 2026-09-17 - Phase 16 Advanced Learning Intelligence & Ecosystem

### Added
- **Structured Knowledge Profile & Skill Evidence Graph**:
  - Distinguishes observed, inferred, and self-reported skills with confidence calculation (`HIGH`, `MEDIUM`, `LOW`).
  - Evidence subdocuments tracking verified assessments, coding practice, and deployed projects.
- **Skill Dependency & Prerequisite Gap Engine**:
  - Recursive prerequisite chain traversal pinpointing root gaps when students struggle.
  - Transparent remediation guidance with recommended actions.
- **Adaptive Diagnostic Assessment**:
  - 5-question dynamic testing adjusting across 3 difficulty tiers with instant explanations.
  - Diagnostic report compiling strong skills, developing areas, gaps, and tailored curriculum.
- **Spaced Repetition & Mistake Bank**:
  - Configurable review intervals (`Day 1, 3, 7, 14, 30`) with active recall prompts.
  - Mistake bank categorization (`CONCEPT`, `SYNTAX`, `LOGIC`, `CARELESS`, `KNOWLEDGE_GAP`) and repeated error pattern clustering.
- **AI Tutor 2.0 & Unified Tool Registry**:
  - Socratic dialogue mode and Teach-back comprehension analysis.
  - 4-tier progressive hint disclosure and safe multi-language code explanation.
  - Backend-authorized AI Tool Registry enforcing strict tenant and context isolation.
- **Project Progression & Institutional Cohorts**:
  - 8-stage project progression with repository verification and live URL health checks.
  - Institutional cohorts management with completion velocity and drop-off risk detection.
  - Platform Data Quality scanner and audited repair engine with confirmation token protection.

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
