# Admin Console User Guide

## 1. Platform Administration Overview
The Admin Console (`http://localhost:3002` or admin domain in production) provides comprehensive operational controls, user governance, content moderation, security auditing, and telemetry monitoring for platform administrators.

---

## 2. User & Access Governance (`/users`, `/admins`)
- **User Management**:
  - Filter accounts across `STUDENT`, `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`, and `EMPLOYER`.
  - Suspend, deactivate, or reactivate accounts with audited reason logging.
  - Review email verification status and recent login timestamps.
- **Privilege Separation**:
  - Super Admins can assign and revoke administrative privileges. All role modifications are written to the immutable audit log.

---

## 3. Curriculum Moderation & Governance (`/courses`)
- **Course Review Queue**:
  - Review courses submitted by instructors (`PENDING_REVIEW`).
  - Audit syllabus quality, check video preview links, and inspect assessment configurations.
  - Approve courses for public catalog publishing or reject with actionable feedback.

---

## 4. Platform Health, Telemetry & Security (`/system-health`, `/audit-logs`)
- **System Health**:
  - Real-time monitoring of process uptime, MongoDB connectivity, memory consumption, and active request rates.
- **Audit Logs (`/audit-logs`)**:
  - Searchable, immutable event trail recording actor, action, resource type, IP hash, and timestamp.
- **AI Monitoring (`/ai-monitoring`)**:
  - Monitor external AI token usage, prompt versions, circuit breaker trip frequency, and failover health.

---

## 5. Support Operations & Data Quality (`/reports`, `/data-quality`)
- **Support Tickets**:
  - Triage, assign, and resolve student and instructor inquiry tickets across Technical, Account, and Content categories.
- **Data Quality Scanner (`/data-quality`)**:
  - Periodic automated checks detecting orphan enrollments, broken lesson sequences, and missing prerequisite links with audited auto-repair tools.
