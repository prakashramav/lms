# Database Architecture & Index Audit

## 1. Data Models & Schemas

The database layer runs on MongoDB via Mongoose. The core entities include:

| Model | Collection | Primary Responsibility |
| :--- | :--- | :--- |
| `User` | `users` | Identity, credentials, role (STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN), status |
| `Course` | `courses` | Curriculum meta, slug, instructor ref, approval status, pricing, tags |
| `Module` | `modules` | Ordered curricular chapters belonging to a course |
| `Lesson` | `lessons` | Video, article, or resource content ordered within a module |
| `Assessment` | `assessments` | Quizzes, module tests, passing marks, time limits |
| `Question` | `questions` | Multiple choice questions linked to assessments |
| `Problem` | `problems` | Coding challenges, difficulties, templates, tags |
| `TestCase` | `testcases` | Public and hidden test cases for coding problems |
| `Submission` | `submissions` | Student code submissions, verdicts, test run scores, execution stats |
| `Enrollment` | `enrollments` | Student course enrollments, completion percentage, active timestamps |
| `Progress` | `progresses` | Granular lesson completion tracking |
| `AuditLog` | `auditlogs` | Immutable audit trail of administrative and security events |
| `Notification` | `notifications` | In-app user notifications and alerts |
| `Report` | `reports` | Content moderation flags and support tickets |
| `PlatformSetting` | `platformsettings` | Key-value system configuration toggles |

---

## 2. Key Relationships

```
User (Instructor) ─────────► Course
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
              Module      Assessment     Enrollment ◄── User (Student)
                │              │              │
                ▼              ▼              ▼
              Lesson        Question       Progress
                                              │
User (Student) ────────► Submission ◄──── Problem
                            │                │
                            ▼                ▼
                       TestResults       TestCase (Public & Hidden)
```

---

## 3. Database Index Audit & Optimization

### Redundancy Elimination
Redundant single-field indexes covered by compound index prefixes were audited and consolidated:
- **`Module`**: Compound index `{ courseId: 1, order: 1 }` covers all course module lookups in sort order.
- **`Lesson`**: Compound index `{ courseId: 1, moduleId: 1, order: 1 }` enables instantaneous sequential traversal.
- **`Enrollment`**: Unique compound index `{ studentId: 1, courseId: 1 }` eliminates duplicate enrollments.
- **`Submission`**: Compound index `{ studentId: 1, problemId: 1, createdAt: -1 }` powers student submission histories.
- **`AuditLog`**: Compound indexes `{ actorId: 1, timestamp: -1 }` and `{ resourceType: 1, resourceId: 1, timestamp: -1 }` ensure instant telemetry querying.

---

## 4. State Machines & Valid Lifecycle Transitions

### Course State Machine
```
[DRAFT] ──────► [PENDING_REVIEW] ──────► [APPROVED] ──────► [PUBLISHED]
                        │                                          │
                        ▼                                          ▼
                   [REJECTED] ──► [DRAFT]                 [ARCHIVED/SUSPENDED]
```

### User State Machine
```
[PENDING] ──────► [ACTIVE] ◄──────► [SUSPENDED]
                      │
                      ▼
               [DEACTIVATED]
```

---

## 5. Backup & Disaster Recovery Strategy

### Automated Backup Schedule
- **Continuous Backups**: MongoDB Atlas Point-in-Time Restore (PITR) enabled with 7-day retention.
- **Nightly Snapshots**: Full logical mongodump snapshot exported at 02:00 UTC, encrypted via AES-256 and stored in an off-region S3 bucket.

### Restoration Procedure
1. Create isolated verification cluster.
2. Restore target snapshot using `mongorestore --drop --gzip --archive=<BACKUP_FILE>`.
3. Validate document counts and run integration test suite against restored database.
4. Promote verified cluster or update application connection string.
