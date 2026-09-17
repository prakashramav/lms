# Role-Based Access Control (RBAC) & Permission Matrix

## 1. Overview
ApexLearn enforces strict, server-side Role-Based Access Control (RBAC) combined with Attribute-Based Access Control (ABAC) for tenant-scoped and resource-level ownership validation.

---

## 2. Comprehensive RBAC Matrix

| Domain Resource | Action | Student | Instructor | Mentor | Moderator | Employer | Org Admin | Platform Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Courses (Public)** | View Catalog | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Courses** | Create / Edit Draft | Denied | Own Courses | Denied | Denied | Denied | Org Courses | Allowed |
| **Courses** | Approve / Publish | Denied | Denied | Denied | Denied | Denied | Org Only | Allowed |
| **Assessments** | Take / Submit | Enrolled | Denied | Denied | Denied | Denied | Denied | Allowed |
| **Assessments** | View Hidden Test Cases | Denied | Own Course | Denied | Denied | Denied | Denied | Allowed |
| **Code Sandbox** | Execute Code | Allowed | Allowed | Allowed | Allowed | Denied | Allowed | Allowed |
| **Mentorship** | Request Session | Allowed | Allowed | Denied | Denied | Denied | Allowed | Allowed |
| **Mentorship** | Accept / Reject Slot | Denied | Denied | Own Profile| Denied | Denied | Denied | Allowed |
| **Mentorship** | View Private Mentor Notes | Denied | Denied | Own Notes | Denied | Denied | Denied | Allowed |
| **Events** | Register / Attend | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Events** | Create / Host Event | Denied | Allowed | Allowed | Denied | Career Events| Org Events | Allowed |
| **Community** | Post / Comment | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Community** | Lock / Hide / Moderate | Denied | Own Channel | Denied | Allowed | Denied | Org Channel | Allowed |
| **Certificates** | View / Download | Own Cert | Denied | Denied | Denied | Denied | Org Students| Allowed |
| **Certificates** | Revoke Certificate | Denied | Denied | Denied | Denied | Denied | Denied | Allowed |
| **Marketplace** | Purchase / Checkout | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Marketplace** | Set Product Price | Denied | Own Product | Own Product| Denied | Denied | Denied | Allowed |
| **Users / Roster** | View Multi-Tenant Roster | Denied | Cohort Only | Denied | Denied | Candidates | Org Roster | Allowed |
| **Audit Logs** | Query Security Logs | Denied | Denied | Denied | Denied | Denied | Org Audit | Allowed |

---

## 3. Attribute-Based Access Control (ABAC) Rules
In addition to role membership, access to specific entity IDs is guarded by ABAC checks in middleware:
- **Course Ownership**: An instructor can only mutate courses where `course.instructorId.toString() === req.user._id.toString()`.
- **Tenant Boundary**: Organization users cannot query or mutate records where `record.organizationId !== req.user.organizationId`.
- **Private Submissions**: Code test cases, student answers, and private mentor notes are never accessible to peers.
