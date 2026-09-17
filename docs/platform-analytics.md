# Platform Analytics & AI Telemetry

## 1. Core Principles
- **No Fabricated Data**: All metric cards, completion percentages, counts, and graphs are dynamically computed via MongoDB aggregation pipelines.
- **Aggregation over Client Calculation**: Aggregations are performed server-side with optimized indexes (`status`, `createdAt`, `role`, `courseId`).
- **Privacy Protections**: Learning analytics show aggregated student performance without leaking individual AI dialogues or sensitive personal identifiers.

## 2. Analytics Surfaces
- **Global Overview (`/api/v1/admin/analytics/overview`)**:
  - Total Students, Instructors, Courses, Published Courses, Pending Approvals, Total Enrollments, Active Users, Platform Completion Rate, Assessment Attempts, Coding Submissions, AI Requests.
- **User Analytics (`/api/v1/admin/analytics/users`)**:
  - Breakdown by Role (`STUDENT`, `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`).
  - Breakdown by Account Status (`ACTIVE`, `PENDING`, `SUSPENDED`, `DEACTIVATED`).
  - Monthly user growth trajectory.
- **Course Analytics (`/api/v1/admin/analytics/courses`)**:
  - Courses by lifecycle status.
  - Top enrolled courses by student count.
  - Global enrollment vs completion ratios.
- **Learning Analytics (`/api/v1/admin/analytics/learning`)**:
  - Quiz pass rate and average scores across attempts.
  - Coding practice submissions: attempts, accepted solutions, acceptance percentage.
- **AI Monitoring (`/api/v1/admin/analytics/ai`)**:
  - Total AI interactions logged.
  - Token consumption aggregates (prompt + completion).
  - Estimated API costs.
  - Token efficiency and rate limit warnings.
