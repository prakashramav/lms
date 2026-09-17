# Role-Based Access Control (RBAC) Permission Matrix

| Capability / Resource | Student | Instructor | Admin | Security Enforcement |
| :--- | :---: | :---: | :---: | :--- |
| **View Published Courses** | ✓ | ✓ | ✓ | Public / Student API |
| **Enroll in Course** | ✓ | ✗ | ✓ | Student Enrollment Engine |
| **Take Assessments & Quizzes** | ✓ | ✗ | ✗ | Student Assessment Engine |
| **Run Practice Code Sandbox** | ✓ | ✓ | ✓ | Judge Worker Sandbox |
| **Interact with AI Tutor** | ✓ | ✗ | ✗ | AI Tutor Service (Student Only) |
| **View Personal Learning Progress**| ✓ | ✗ | ✗ | Student Dashboard API |
| **Create Course Blueprint** | ✗ | ✓ | ✓ | `authorize('INSTRUCTOR', 'ADMIN')` |
| **Edit Own Authored Course** | ✗ | ✓ | ✓ | `requireCourseOwner` Middleware |
| **Edit Any Course (Platform-Wide)**| ✗ | ✗ | ✓ | `authorize('ADMIN')` |
| **Publish Own Course** | ✗ | ✓* | ✓ | Server-side validation checklist |
| **Author Quiz & Question Bank** | ✗ | ✓ | ✓ | Instructor Assessment Studio |
| **Access Hidden Test Cases** | ✗ | ✓* | ✓ | Sanitized on student endpoints |
| **Access Quiz Correct Answers** | ✗ | ✓* | ✓ | Sanitized on student endpoints |
| **View Course Cohort Telemetry** | ✗ | ✓* | ✓ | Isolated strictly to owned courses |
| **Global Platform Analytics** | ✗ | ✗ | ✓ | Admin Telemetry Engine |
| **Manage Users & Permissions** | ✗ | ✗ | ✓ | Admin Governance Suite |
| **Elevate Role to Admin** | ✗ | ✗ | ✗ | Immutable; forbidden by server |

*\*Only accessible for resources specifically created and owned by that instructor.*
