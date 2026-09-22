# Comprehensive API Inventory

This document details all routes exposed by the backend API Gateway (`http://localhost:5000/api/v1`), including authentication prerequisites, role authorizations, rate limits, and request/response specifications.

---

## 1. System Health & Probes

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | GET | None | Public | General | Fast process liveness check |
| `/ready` | GET | None | Public | General | Backing dependency verification (MongoDB) |
| `/live` | GET | None | Public | General | Process uptime check |
| `/metrics` | GET | None | Public | General | Telemetry snapshot (request counts, latency) |

---

## 2. Authentication & Identity (`/api/v1/auth`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/register` | POST | None | Public | Auth | Create a student or instructor account |
| `/login` | POST | None | Public | Auth | Authenticate user, return access token & set refresh cookie |
| `/refresh` | POST | Cookie | Authenticated | Auth | Rotate access token using valid refresh token |
| `/logout` | POST | None | Authenticated | Auth | Invalidate refresh token and clear cookie |
| `/forgot-password` | POST | None | Public | Auth | Request password reset token |
| `/reset-password` | POST | None | Public | Auth | Reset password using verified reset token |
| `/me` | GET | Bearer | Authenticated | General | Retrieve current authenticated user profile |

---

## 3. Student Services (`/api/v1/student`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | GET | Bearer | STUDENT | General | Aggregated dashboard: enrollments, stats, daily tasks |

---

## 4. Course Catalog & Curriculum (`/api/v1/courses`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | GET | Optional | Public / Student | General | Paginated course catalog with search, filter, and sort |
| `/:slug` | GET | Optional | Public / Student | General | Public course landing page and curriculum outline |
| `/:courseId/curriculum` | GET | Bearer | Authenticated | General | Full curriculum player (masked if locked) |

---

## 5. Enrollments & Learning Progress (`/api/v1/enrollments`, `/api/v1/progress`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/enrollments` | POST | Bearer | STUDENT | General | Enroll student in published course |
| `/enrollments/my-courses` | GET | Bearer | STUDENT | General | List active student enrollments |
| `/progress/update` | POST | Bearer | STUDENT | General | Track lesson progress, playback time, and completion |

---

## 6. Certificates & Credentials (`/api/v1/certificates`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/verify/:certificateId` | GET | None | Public | General | Public certificate verification (name, course, date) |
| `/issue/:courseId` | POST | Bearer | STUDENT | General | Idempotently issue course completion certificate |
| `/my-certificates` | GET | Bearer | STUDENT | General | Retrieve all certificates awarded to student |

---

## 7. Assessments & Submissions (`/api/v1/assessments`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/course/:courseId` | GET | Bearer | STUDENT, INSTRUCTOR | General | List quizzes and exams for course |
| `/:id/start` | POST | Bearer | STUDENT | General | Initiate assessment attempt session |
| `/:id/submit` | POST | Bearer | STUDENT | General | Submit assessment responses for automated grading |

---

## 8. Coding Sandbox (`/api/v1/practice`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/problems` | GET | Bearer | STUDENT | Coding | List algorithmic practice challenges |
| `/problems/:slug` | GET | Bearer | STUDENT | Coding | Retrieve problem details, starter code, and test specs |
| `/execute` | POST | Bearer | STUDENT | Coding | Execute code in sandbox against sample inputs |
| `/submit` | POST | Bearer | STUDENT | Coding | Run code against hidden test cases & grade submission |

---

## 9. AI Intelligence & Tutor (`/api/v1/ai`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/chat` | POST | Bearer | STUDENT | AI | Interactive AI tutor conversation with context injection |
| `/explain` | POST | Bearer | STUDENT | AI | Request step-by-step code or concept explanations |
| `/evaluate-code`| POST | Bearer | STUDENT | AI | Request AI code review, complexity analysis, and hints |

---

## 10. Learning Intelligence Ecosystem (`/api/v1/learning-intelligence`, `/api/v1/diagnostic`, `/api/v1/spaced-review`, `/api/v1/cohorts`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/diagnostic/start` | POST | Bearer | STUDENT | General | Start adaptive 3-tier diagnostic assessment |
| `/diagnostic/respond` | POST | Bearer | STUDENT | General | Submit tier answers and generate mastery report |
| `/spaced-review/due` | GET | Bearer | STUDENT | General | Fetch flashcards and recall topics scheduled for review |
| `/spaced-review/record`| POST | Bearer | STUDENT | General | Update interval schedule based on review success |
| `/learning-intelligence/profile` | GET | Bearer | STUDENT | General | Retrieve learner skill radar and knowledge gaps |
| `/cohorts` | GET | Bearer | INSTRUCTOR, ADMIN | General | List active cohorts with progress metrics |

---

## 11. Career Intelligence & Jobs (`/api/v1/career`, `/api/v1/jobs`, `/api/v1/employer`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/jobs` | GET | Optional | Public / Student | General | Search and filter job listings |
| `/jobs/:id/apply` | POST | Bearer | STUDENT | General | Submit application with resume and cover letter |
| `/career/resume` | GET/POST | Bearer | STUDENT | General | Create or retrieve student ATS resume |
| `/employer/applications` | GET | Bearer | EMPLOYER, ADMIN | General | Manage ATS candidate pipeline and review applicants |

---

## 12. Instructor Studio (`/api/v1/instructor`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/courses` | GET/POST | Bearer | INSTRUCTOR | General | List author's courses or draft a new course |
| `/courses/:courseId` | PUT/DELETE | Bearer | INSTRUCTOR | General | Update course curriculum or archive course |
| `/analytics` | GET | Bearer | INSTRUCTOR | General | View enrollment trends, completion rates, and feedback |

---

## 13. Admin Governance & Platform Operations (`/api/v1/admin`)

| Route | Method | Auth | Role | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/users` | GET/PUT | Bearer | ADMIN, SUPER_ADMIN | Admin | Manage user accounts, assign roles, suspend/activate |
| `/courses/pending`| GET | Bearer | ADMIN, SUPER_ADMIN | Admin | Review pending courses for publication approval |
| `/courses/:id/status`| PATCH | Bearer | ADMIN, SUPER_ADMIN | Admin | Approve, reject, or archive courses |
| `/audit-logs` | GET | Bearer | ADMIN, SUPER_ADMIN | Admin | Query immutable platform audit logs |
| `/system-health` | GET | Bearer | ADMIN, SUPER_ADMIN | Admin | Platform uptime, database latency, and worker status |
