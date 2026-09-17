# Admin API Reference

All administrative endpoints are rooted at `/api/v1/admin` and require an authorized JWT with `role: 'ADMIN'` or `role: 'SUPER_ADMIN'`.

## User Operations
- `GET /api/v1/admin/users`: Search and filter students and instructors with pagination.
  - Query parameters: `q`, `role`, `status`, `page`, `limit`.
- `GET /api/v1/admin/users/:userId`: Detailed profile, activity, enrollments, and status history.
- `PATCH /api/v1/admin/users/:userId/status`: Update account lifecycle status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`). Requires `reason`.
- `GET /api/v1/admin/students/:studentId`: Operational overview including quizzes, submissions, progress, and activity.

## Instructor Governance
- `GET /api/v1/admin/instructors`: List instructors with course/student aggregates.
- `GET /api/v1/admin/instructors/:instructorId`: Detailed profile and curriculum catalog.
- `POST /api/v1/admin/instructors/:instructorId/approve`: Approve pending instructor application.
- `POST /api/v1/admin/instructors/:instructorId/reject`: Reject instructor application with reason.
- `POST /api/v1/admin/instructors/:instructorId/suspend`: Suspend instructor privileges.
- `POST /api/v1/admin/instructors/:instructorId/activate`: Re-activate suspended instructor.

## Course Moderation & Review
- `GET /api/v1/admin/courses`: Query all courses across all lifecycle statuses.
- `GET /api/v1/admin/courses/pending`: List all courses awaiting administrative review.
- `GET /api/v1/admin/courses/:courseId/review`: Comprehensive curriculum tree, modules, lessons, quizzes, problems, and author details.
- `POST /api/v1/admin/courses/:courseId/approve`: Set course status to `APPROVED`.
- `POST /api/v1/admin/courses/:courseId/reject`: Set status to `REJECTED` with feedback reason.
- `POST /api/v1/admin/courses/:courseId/publish`: Transition approved course to `PUBLISHED` (visible to students).
- `POST /api/v1/admin/courses/:courseId/unpublish`: Return course to `DRAFT`.
- `POST /api/v1/admin/courses/:courseId/archive`: Mark course as `ARCHIVED`.

## Moderation, Reporting & Incidents
- `GET /api/v1/admin/reports`: List user and content incident reports.
- `GET /api/v1/admin/reports/:reportId`: Incident investigation view.
- `PATCH /api/v1/admin/reports/:reportId`: Update report status (`INVESTIGATING`, `RESOLVED`, `DISMISSED`) and record resolution notes.

## Platform Analytics & Health
- `GET /api/v1/admin/analytics/overview`: High-level platform KPIs.
- `GET /api/v1/admin/analytics/users`: User growth, active users, and role distribution.
- `GET /api/v1/admin/analytics/courses`: Course metrics, completion rate, top enrolled courses.
- `GET /api/v1/admin/analytics/learning`: Quiz scores, problems attempted vs solved, lessons completed.
- `GET /api/v1/admin/analytics/ai`: AI token volume, cost estimates, request frequencies, and privacy guards.
- `GET /api/v1/admin/system/health`: Safe operational status (database, memory, judge runners, redis).

## Audit Trail & Security
- `GET /api/v1/admin/audit-logs`: Searchable append-only audit trail with actor, action, and resource filters.
- `GET /api/v1/admin/audit-logs/export`: Secure export in CSV or JSON format. Audited upon execution.

## Platform Settings & Feature Flags
- `GET /api/v1/admin/settings`: Retrieve global configuration.
- `PATCH /api/v1/admin/settings`: Update configuration keys.
- `GET /api/v1/admin/feature-flags`: List feature flags and environments.
- `PATCH /api/v1/admin/feature-flags/:key`: Enable or disable feature flags.

## Admin Management (Super Admin Only)
- `GET /api/v1/admin/admins`: List platform administrators.
- `POST /api/v1/admin/admins`: Provision new administrator with designated permissions.
- `PATCH /api/v1/admin/admins/:adminId`: Modify permissions or update status.
- `POST /api/v1/admin/admins/:adminId/disable`: Deactivate administrator account.
