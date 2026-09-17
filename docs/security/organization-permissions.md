# Organization Role & Permission Matrix

## 1. Multi-Tenant Organization Roles Overview
The platform supports multi-tenant organizations across Educational Institutions, Bootcamps, Corporate Enterprises, and Employers. Organization roles govern access boundaries within specific organization domains (`organizationId`).

---

## 2. Organization Permission Matrix

| Permission Key | Organization Admin | Instructor / Educator | Mentor / TA | Learner / Student | Recruiter / Hiring Mgr |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`org.view`** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **`org.settings.update`** | ✓ | — | — | — | — |
| **`org.members.invite`** | ✓ | — | — | — | — |
| **`org.members.remove`** | ✓ | — | — | — | — |
| **`org.members.role_change`** | ✓ | — | — | — | — |
| **`org.courses.create`** | ✓ | ✓ | — | — | — |
| **`org.courses.publish`** | ✓ | ✓ | — | — | — |
| **`org.cohorts.manage`** | ✓ | ✓ | ✓ | — | — |
| **`org.assessments.grade`** | ✓ | ✓ | ✓ | — | — |
| **`org.analytics.view`** | ✓ | ✓ | — | — | ✓ |
| **`org.jobs.manage`** | ✓ | — | — | — | ✓ |
| **`org.candidates.review`**| ✓ | — | — | — | ✓ |
| **`org.data.export`** | ✓ | — | — | — | — |

---

## 3. Tenant Isolation & Server-Side Guarantees
1. **No Client-Side Injections**: `organizationId` is never trusted directly from client request bodies. It is resolved from authenticated sessions or checked against the user's membership list (`organization.members.userId`).
2. **Data Boundary**: Organization A users can never access Organization B cohorts, student private submissions, candidate profiles, or institutional analytics. Cross-tenant requests return HTTP 403 `FORBIDDEN_RESOURCE_ACCESS`.
