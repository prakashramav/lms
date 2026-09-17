# Admin Permission Matrix & Access Controls

## Roles
- `SUPER_ADMIN`: Root administrator with exhaustive rights.
- `ADMIN`: Operational administrator with explicit permission grants.

## Permission Matrix
| Permission Key | Description | ADMIN | SUPER_ADMIN |
|---|---|:---:|:---:|
| `users.read` | View students, instructors, and staff lists/details | ✓ | ✓ |
| `users.update` | Update user metadata, roles, or status | ✓* | ✓ |
| `users.suspend` | Suspend or activate student accounts | ✓* | ✓ |
| `instructors.approve` | Approve, reject, or suspend instructors | ✓* | ✓ |
| `courses.read` | Inspect course catalogs, curriculums, and lessons | ✓ | ✓ |
| `courses.review` | Perform detailed curriculum and content reviews | ✓* | ✓ |
| `courses.approve` | Approve or reject courses submitted for review | ✓* | ✓ |
| `courses.publish` | Publish, unpublish, or archive courses | ✓* | ✓ |
| `assessments.manage` | Inspect assessments and disable/restore items | ✓* | ✓ |
| `problems.manage` | Inspect problem bank and toggle visibility | ✓* | ✓ |
| `categories.manage` | Create, edit, and archive taxonomy categories | ✓* | ✓ |
| `reports.manage` | Investigate, assign, resolve, and dismiss reports | ✓* | ✓ |
| `analytics.read` | View global, user, course, and learning analytics | ✓ | ✓ |
| `audit.read` | Query append-only audit trail and export logs | ✓* | ✓ |
| `settings.manage` | Configure platform settings & feature flags | ✓* | ✓ |
| `admins.manage` | Provision admins, revoke access, edit permissions | ✗ | ✓ |

*\* Requires explicit grant in `user.permissions` array.*

## Middleware Enforcement
```javascript
// Example: Route protection
router.patch('/users/:userId/status', requirePermission('users.suspend'), updateUserStatus);
router.post('/instructors/:id/approve', requirePermission('instructors.approve'), approveInstructor);
router.post('/courses/:id/publish', requirePermission('courses.publish'), publishCourse);
router.get('/admins', requireSuperAdmin, listAdmins);
```
