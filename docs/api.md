# API Specification (v1)

Base URL: `/api/v1`

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE_IDENTIFIER"
}
```

---

## Endpoints

### System Endpoints
- `GET /api/v1/health` - Uptime and operational health status.

---

### Student Endpoints (`/api/v1/student`)

#### 1. Student Dashboard Telemetry
- **URL**: `GET /api/v1/student/dashboard`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK`
  Returns current course, progress %, daily goals, streak, pending tasks, recent activity, recommendations, and career readiness profile.

---

### Authentication Endpoints (`/api/v1/auth`)

#### 1. Student Registration
- **URL**: `POST /api/v1/auth/register`
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: `201 Created`
  Returns user object, access token, sets HTTP-only refresh cookie.

#### 2. User Login
- **URL**: `POST /api/v1/auth/login`
- **Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!",
    "expectedRole": "STUDENT" // Optional: enforces portal role match
  }
  ```
- **Response**: `200 OK`
  Returns user object, access token, and sets refresh token cookie.

#### 3. Refresh Token Rotation
- **URL**: `POST /api/v1/auth/refresh`
- **Body / Cookie**: `{ "refreshToken": "..." }` or sent automatically via cookie.
- **Response**: `200 OK`
  Rotates refresh token in database and returns new access token.

#### 4. User Logout
- **URL**: `POST /api/v1/auth/logout`
- **Response**: `200 OK`
  Revokes the active refresh token and clears cookie.

#### 5. Get Current User Profile
- **URL**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**: `200 OK`
  Returns authenticated user record.

#### 6. Forgot Password
- **URL**: `POST /api/v1/auth/forgot-password`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK`
  Returns generic acknowledgement to prevent user enumeration.

#### 7. Reset Password
- **URL**: `POST /api/v1/auth/reset-password`
- **Body**: `{ "token": "...", "password": "NewPassword123!" }`
- **Response**: `200 OK`
  Updates password and revokes all active user sessions.

---

### Protected Administrative Endpoints (`/api/v1/admin`)

#### 1. Governance Overview
- **URL**: `GET /api/v1/admin/overview`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `ADMIN`
- **Response**: `200 OK` if role is `ADMIN`, otherwise `403 Forbidden`.

---

### Course & Discovery Endpoints (`/api/v1/courses`)

#### 1. Public Course Catalog
- **URL**: `GET /api/v1/courses`
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 12)
  - `search` (full-text search over title, description, skills, category)
  - `category` (filter by category)
  - `difficulty` (`Beginner`, `Intermediate`, `Advanced`)
  - `sort` (`newest`, `oldest`, `shortest`, `longest`)
- **Response**: `200 OK` with `{ items, page, limit, total, totalPages }`

#### 2. Course Details by Slug
- **URL**: `GET /api/v1/courses/:slug`
- **Headers**: Optional `Authorization: Bearer <accessToken>`
- **Response**: `200 OK` with complete course details, instructor, and sanitized curriculum modules.

#### 3. Course Curriculum Modules & Lessons
- **URL**: `GET /api/v1/courses/:courseId/modules`
- **Headers**: Optional `Authorization: Bearer <accessToken>`
- **Response**: `200 OK` with ordered modules and lessons. Protected lesson content is masked for unenrolled visitors.

---

### Enrollment Endpoints (`/api/v1/enrollments`)

#### 1. Enroll in a Course
- **URL**: `POST /api/v1/enrollments`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Body**: `{ "courseId": "<courseId>" }`
- **Behavior**: Idempotent. Returns existing active enrollment if already enrolled.
- **Response**: `201 Created` or `200 OK`

#### 2. Get Student Enrollments
- **URL**: `GET /api/v1/enrollments`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with array of student's active and completed enrollments.

#### 3. Get Single Course Enrollment
- **URL**: `GET /api/v1/enrollments/:courseId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with enrollment object, or `404 Not Found` if not enrolled.

---

### Progress Tracking Endpoints (`/api/v1/progress`)

#### 1. Get Course Progress
- **URL**: `GET /api/v1/progress/:courseId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with `{ progress: [...], completedLessons: N, totalLessons: M, progressPercentage: P }`

#### 2. Start Lesson Progress
- **URL**: `POST /api/v1/progress/lessons/:lessonId/start`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` initializes or returns progress record.

#### 3. Update Lesson Playback / Time Spent
- **URL**: `PATCH /api/v1/progress/lessons/:lessonId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Body**: `{ "lastPosition": 120, "timeSpent": 300 }`
- **Response**: `200 OK`

#### 4. Mark Lesson Complete
- **URL**: `POST /api/v1/progress/lessons/:lessonId/complete`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with updated progress and recalculates course enrollment percentage.

---

### Bookmark Endpoints (`/api/v1/bookmarks`)

#### 1. List Bookmarks
- **URL**: `GET /api/v1/bookmarks`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`

#### 2. Toggle Bookmark
- **URL**: `POST /api/v1/bookmarks/:lessonId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with `{ bookmarked: true | false }`

#### 3. Remove Bookmark
- **URL**: `DELETE /api/v1/bookmarks/:lessonId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`

---

### Assessment & Quiz Endpoints (`/api/v1/assessments`)

#### 1. List Assessments
- **URL**: `GET /api/v1/assessments`
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 12)
  - `search` (text search over title and description)
  - `courseId` (filter by associated course)
  - `moduleId` (filter by module)
  - `difficulty` (`Beginner`, `Intermediate`, `Advanced`)
  - `type` (`QUIZ`, `PRACTICE_TEST`, `MODULE_ASSESSMENT`, `COURSE_ASSESSMENT`)
- **Headers**: Optional `Authorization: Bearer <accessToken>` (enriches response with student attempts)
- **Response**: `200 OK` with `{ items, page, limit, total, totalPages }`

#### 2. Get Assessment Details
- **URL**: `GET /api/v1/assessments/:assessmentId`
- **Headers**: Optional `Authorization: Bearer <accessToken>`
- **Response**: `200 OK` with assessment instructions, duration, passing score, question count, and previous attempt records.

#### 3. Start Assessment Attempt
- **URL**: `POST /api/v1/assessments/:assessmentId/attempts`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Behavior**: Verifies course enrollment and attempt limits. If an unexpired attempt is already in-progress, restores it. Returns safe questions with `correctAnswers` and `explanation` strictly omitted.
- **Response**: `201 Created` or `200 OK` (when restored)

#### 4. Get Active Attempt
- **URL**: `GET /api/v1/assessments/attempts/:attemptId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Response**: `200 OK` with attempt progress, safe questions, and `expiresAt` timestamp.

#### 5. Auto-Save Answer
- **URL**: `PATCH /api/v1/assessments/attempts/:attemptId/answers`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Body**: `{ "questionId": "<questionId>", "selectedAnswers": ["a", "b"] }`
- **Behavior**: Validates attempt ownership, timer validity, and question options. Updates answer state idempotently.
- **Response**: `200 OK`

#### 6. Submit Assessment Attempt
- **URL**: `POST /api/v1/assessments/attempts/:attemptId/submit`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Behavior**: Server-side grading comparing student selections against true answer keys. Calculates score, percentage, and pass/fail status.
- **Response**: `200 OK` with detailed results summary.

#### 7. Get Attempt Result
- **URL**: `GET /api/v1/assessments/attempts/:attemptId/result`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT` (must be attempt owner)
- **Response**: `200 OK` with percentage, pass/fail, breakdown of correct/incorrect/unanswered, and time spent.

#### 8. Question-by-Question Review with Explanations
- **URL**: `GET /api/v1/assessments/attempts/:attemptId/review`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT` (must be attempt owner)
- **Response**: `200 OK` with student answers, correct answer keys, marks awarded, and pedagogical explanations.

#### 9. Get Assessment History
- **URL**: `GET /api/v1/assessments/history`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT`
- **Query Parameters**: `page`, `limit`
- **Response**: `200 OK` with paginated list of student's completed attempts sorted newest first.

---

### Practice & Online Judge (`/api/v1/practice`)

#### 1. List Supported Languages
- **URL**: `GET /api/v1/practice/languages`
- **Access**: Public
- **Response**: `200 OK` with list of currently available languages and execution runtimes.

#### 2. Get Problem Catalog
- **URL**: `GET /api/v1/practice/problems`
- **Access**: Public / Optional Auth (attaches `isSolved` and `isBookmarked` if authenticated)
- **Query Parameters**: `category`, `difficulty`, `language`, `topic`, `status`, `search`, `sort`, `page`, `limit`
- **Response**: `200 OK` with paginated list of published coding problems.

#### 3. Get Problem Details
- **URL**: `GET /api/v1/practice/problems/:slug`
- **Access**: Public / Optional Auth
- **Security**: Hidden test cases are strictly omitted from response.
- **Response**: `200 OK` with problem description, examples, constraints, hints, and public test cases.

#### 4. Run Code (Public / Custom Tests)
- **URL**: `POST /api/v1/practice/problems/:problemId/run`
- **Access**: Public / Optional Auth (Rate limited: 30 runs/min)
- **Body**: `{ "language": "javascript", "code": "...", "customInput": "..." }`
- **Response**: `200 OK` with verdict, testResults, stdout, stderr, executionTime, and memoryUsed.

#### 5. Submit Code (Full Hidden Test Evaluation)
- **URL**: `POST /api/v1/practice/problems/:problemId/submit`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Requirement**: `STUDENT` (Rate limited: 15 submissions/min)
- **Body**: `{ "language": "javascript", "code": "..." }`
- **Response**: `201 Created` with submissionId, verdict, score, passedTests, totalTests, and masked testResults.

#### 6. Code Draft Autosave
- **URL**: `PUT /api/v1/practice/drafts/:problemId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Body**: `{ "language": "javascript", "code": "..." }`
- **Response**: `200 OK`

#### 7. Toggle Bookmark
- **URL**: `POST /api/v1/practice/problems/:problemId/bookmark`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**: `200 OK` with `{ "isBookmarked": true / false }`

#### 8. Student Submissions History
- **URL**: `GET /api/v1/practice/submissions`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Query Parameters**: `problemId`, `language`, `verdict`, `page`, `limit`
- **Response**: `200 OK` with paginated submission history.

#### 9. Get Submission Detail
- **URL**: `GET /api/v1/practice/submissions/:submissionId`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Security**: IDOR protected — only submission owner can access.
- **Response**: `200 OK` with submitted code, verdict, and test case breakdown.

#### 10. Student Practice Progress
- **URL**: `GET /api/v1/practice/progress`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**: `200 OK` with solved counts, coding streak, topic mastery, and difficulty breakdown.

