# Instructor API & Content Authoring System

## 1. Overview
The Instructor API provides dedicated endpoints for faculty members and curriculum designers. All endpoints are mounted at `/api/v1/instructor/*` and are strictly protected by **Authentication** and **Role-Based Access Control (RBAC)** ensuring:
- Only users with the `INSTRUCTOR` or `ADMIN` role can access these endpoints.
- Students attempting to query instructor routes receive `403 Forbidden`.
- Resource ownership is validated on all mutative and analytical requests: instructors can only inspect and modify courses, modules, lessons, assessments, coding problems, and student cohorts that they author.

---

## 2. Authentication & Headers
All requests must supply the JSON Web Token in the Authorization header:
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## 3. Course Management Endpoints

### `GET /api/v1/instructor/courses`
Lists all courses authored by the authenticated instructor with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `search` (string)
- `status` (`DRAFT` | `PUBLISHED` | `ARCHIVED` | `all`)
- `category` (string | `all`)
- `sort` (`newest` | `oldest` | `title`)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "6aab...",
        "title": "Distributed Systems in Go",
        "slug": "distributed-systems-go",
        "status": "PUBLISHED",
        "totalModules": 4,
        "totalLessons": 24,
        "totalStudents": 142,
        "averageCompletion": 68
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
}
```

### `POST /api/v1/instructor/courses`
Initializes a new course blueprint.

**Request Body:**
```json
{
  "title": "Modern Full-Stack Web Architecture",
  "slug": "modern-full-stack-web-architecture",
  "shortDescription": "Master full-stack architecture with Next.js and Node microservices",
  "description": "Comprehensive engineering curriculum detailing distributed systems, Redis caching, and real-time websockets.",
  "category": "Full Stack Development",
  "difficulty": "INTERMEDIATE",
  "language": "English",
  "duration": "24 hours",
  "thumbnail": "https://...",
  "banner": "https://...",
  "skills": ["React", "Node.js", "Redis"],
  "learningObjectives": ["Master RSC", "Scale web servers"],
  "prerequisites": ["Basic JavaScript"]
}
```

### `GET /api/v1/instructor/courses/:courseId`
Fetches full course details including populated modules and lessons.

### `PATCH /api/v1/instructor/courses/:courseId`
Updates course metadata. Enforces ownership (`requireCourseOwner`). Increments course version.

### `POST /api/v1/instructor/courses/:courseId/publish`
Validates publishing requirements:
- Minimum title length (5 chars)
- Minimum short description (20 chars)
- Minimum full description (50 chars)
- At least 1 module
- At least 1 published lesson

### `POST /api/v1/instructor/courses/:courseId/unpublish`
Returns a published course to `DRAFT` status without deleting existing student enrollments.

### `DELETE /api/v1/instructor/courses/:courseId`
Soft-archives the course (`status = 'ARCHIVED'`). Historical submissions and student progress are permanently preserved.

### `POST /api/v1/instructor/courses/:courseId/duplicate`
Duplicates the course, its modules, and lessons into a new draft with regenerated IDs. Submissions and enrollment data are not copied.

---

## 4. Curriculum: Modules & Lessons

### `POST /api/v1/instructor/courses/:courseId/modules`
Creates a new curriculum module.

### `PATCH /api/v1/instructor/modules/:moduleId`
Renames or updates module settings.

### `DELETE /api/v1/instructor/modules/:moduleId`
Removes a module and its child lessons.

### `PATCH /api/v1/instructor/courses/:courseId/modules/reorder`
Persists custom module ordering:
```json
{
  "moduleIds": ["mod_id_1", "mod_id_2", "mod_id_3"]
}
```

### `POST /api/v1/instructor/modules/:moduleId/lessons`
Adds a lesson under a module:
```json
{
  "title": "Understanding Event Loop",
  "type": "ARTICLE",
  "duration": 15,
  "order": 1
}
```

### `PATCH /api/v1/instructor/lessons/:lessonId`
Updates lesson content, video stream URL, code demonstration snippet, or duration.

### `DELETE /api/v1/instructor/lessons/:lessonId`
Deletes a lesson.

### `PATCH /api/v1/instructor/modules/:moduleId/lessons/reorder`
Reorders lessons under a specific module.

---

## 5. File Uploads & Resources

### `POST /api/v1/instructor/upload`
Uploads asset (image, PDF, archive) to local/object storage:
```json
{
  "name": "cheat-sheet.pdf",
  "data": "data:application/pdf;base64,...",
  "mimeType": "application/pdf",
  "folder": "resources"
}
```

### `POST /api/v1/instructor/lessons/:lessonId/resources`
Attaches uploaded file or external link as a lesson resource.

### `DELETE /api/v1/instructor/resources/:resourceId`
Deletes attached resource from database and storage provider.

---

## 6. Assessments & Question Bank

### `GET /api/v1/instructor/assessments`
Lists instructor's authored quizzes and assessments.

### `POST /api/v1/instructor/assessments`
Creates a new assessment container.

### `GET /api/v1/instructor/questions`
Queries Question Bank with search, difficulty, topic, and type filters.

### `POST /api/v1/instructor/questions`
Adds a question with options, correct answer keys, and pedagogical explanations.

---

## 7. Coding Practice Studio & Test Cases

### `GET /api/v1/instructor/problems`
Lists coding problems authored by the instructor.

### `POST /api/v1/instructor/problems`
Creates an algorithmic challenge with starter code and constraints.

### `POST /api/v1/instructor/problems/:problemId/test-cases`
Adds public or hidden test cases:
```json
{
  "input": "[2, 7, 11, 15], 9",
  "expectedOutput": "[0, 1]",
  "isHidden": true,
  "weight": 20
}
```
*Security Guarantee: Hidden test cases are completely sanitized and never returned to student clients.*

### `POST /api/v1/instructor/problems/:problemId/publish`
Validates that at least 1 public and at least 1 hidden test case are configured before publishing.

---

## 8. Student Cohort & Telemetry

### `GET /api/v1/instructor/students`
Lists students enrolled in courses authored by the requesting instructor. Enforces strict tenant isolation.

### `GET /api/v1/instructor/courses/:courseId/students/:studentId`
Retrieves student's learning progress, lesson completions, and quiz scores for the authorized course. Private AI conversations and passwords are never exposed.

---

## 9. Telemetry & Analytics

### `GET /api/v1/instructor/analytics/overview`
Aggregated instructor KPI summary:
- Total Courses, Published Courses, Draft Courses
- Total Distinct Students, Total Enrollments
- Average Course Completion Rate
- Average Automated Quiz Assessment Score
- Course Performance Telemetry
- Recent Platform Activity Logs

### `GET /api/v1/instructor/courses/:courseId/analytics`
Deep course funnel analytics: active students, completion rates, and lesson drop-off telemetry.

---

## 10. AI-Assisted Authoring Assistant

### `POST /api/v1/instructor/ai/generate-outline`
Generates structured lesson outline with learning objectives and conceptual breakdowns.

### `POST /api/v1/instructor/ai/generate-questions`
Generates draft multiple-choice questions with options and explanations.

### `POST /api/v1/instructor/ai/generate-problem`
Generates algorithmic problem draft with starter code skeletons and proposed test inputs.

*Governance Policy: AI-generated content is always returned as editable draft blueprints and is never automatically published.*
