# Audit Logging & Compliance Specification

## 1. Architecture Overview
Audit logging provides an immutable, append-only operational record of all significant administrative decisions and high-impact platform operations. 

```
Admin Action Execution
  ├── Extract Actor ID, Role, IP Address, User Agent
  ├── Validate Action Completion & Status
  └── Persist to AuditLog Collection (Append-Only)
```

## 2. Tracked Operational Events
- **Authentication**: `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `FAILED_ADMIN_LOGIN`
- **User Governance**: `USER_SUSPEND`, `USER_ACTIVATE`, `USER_STATUS_CHANGE`
- **Faculty Governance**: `INSTRUCTOR_APPROVE`, `INSTRUCTOR_REJECT`, `INSTRUCTOR_SUSPEND`, `INSTRUCTOR_ACTIVATE`
- **Curriculum Moderation**: `COURSE_APPROVE`, `COURSE_REJECT`, `COURSE_PUBLISH`, `COURSE_UNPUBLISH`, `COURSE_ARCHIVE`
- **Assessment & Practice**: `ASSESSMENT_DISABLE`, `ASSESSMENT_RESTORE`, `PROBLEM_DISABLE`, `PROBLEM_RESTORE`
- **Incidents & Reports**: `REPORT_RESOLVE`, `REPORT_DISMISS`
- **Configuration & Security**: `SETTINGS_UPDATE`, `FEATURE_FLAG_UPDATE`, `ADMIN_CREATE`, `ADMIN_PERMISSIONS_UPDATE`, `AUDIT_LOG_EXPORT`

## 3. Schema Structure
- `actorId`: ObjectId of user who performed the operation.
- `actorRole`: `ADMIN` or `SUPER_ADMIN`.
- `action`: Standardized event action string.
- `resourceType`: `USER`, `COURSE`, `INSTRUCTOR`, `REPORT`, `SETTINGS`, `FEATURE_FLAG`, etc.
- `resourceId`: Optional identifier of affected document.
- `metadata`: Arbitrary context dictionary (e.g. suspension reason, diffs).
- `ipAddress`: Client IP.
- `userAgent`: Client User Agent.
- `result`: `SUCCESS` or `FAILURE`.
- `createdAt`: ISO-8601 creation timestamp.

## 4. Security & Retention
- Logs are strictly append-only; ordinary administrators cannot modify or prune history.
- Exports in CSV or JSON trigger their own `AUDIT_LOG_EXPORT` audit event with the requesting actor and record count.
