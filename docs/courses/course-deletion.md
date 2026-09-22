# Course Deletion & Lifecycle Management Specification

## 1. Executive Summary
This document defines the architecture, authorization rules, and execution workflows for the Course Deletion System across the EdTech LMS platform. The system supports course deletion by both **Instructors** (scoped to their own courses) and **Administrators** (platform-wide authority), while guaranteeing complete shielding of deleted course material from students.

---

## 2. Deletion Strategy: Hybrid Soft-Delete with AI/Vector Cleanup

### Rationale
A pure hard-delete blindly destroys critical relational integrity required by an accredited LMS:
- **Historical Certificates**: Students who earned verifiable certificates must maintain permanent validation URLs (`/verify/:code`) and credentials.
- **Academic Transcripts & History**: Enrolled student history and progress metrics must remain accessible for institutional audits without corrupting reporting databases.

Therefore, the platform adopts a **Hybrid Soft-Delete** strategy:
1. **Course Document Retention**: The `Course` document is marked `isDeleted: true`, `status: 'ARCHIVED'`, and `isPublished: false`, storing deletion metadata (`deletedAt`, `deletedBy`, `deletionReason`).
2. **AI / RAG Vector Chunk Cleanup**: Vector embeddings in the `VectorChunk` collection tied to the course are hard-deleted immediately to prevent LLM hallucination and search engine retrieval.
3. **Automated Query Shielding**: Mongoose pre-query hooks (`find`, `findOne`, `countDocuments`) automatically append `{ isDeleted: { $ne: true } }` across all queries unless explicitly requesting `{ includeDeleted: true }` (restricted to internal admin audits).

---

## 3. Database Schema Updates

### Course Model (`apps/backend/src/models/course.model.js`)
```javascript
{
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  deletionReason: {
    type: String,
    default: null,
  },
}
```

### Compound Indexes
- `{ isDeleted: 1, isPublished: 1, status: 1 }`
- `{ isDeleted: 1, instructor: 1 }`

### Central Active Filter
```javascript
const activeCourseFilter = {
  isDeleted: false,
  status: 'PUBLISHED',
  isPublished: true,
};
```

---

## 4. Authorization & Security (RBAC & IDOR)

### Rules Matrix
| Role | Action | Endpoint | Verification | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Instructor** | Delete own course | `DELETE /api/v1/courses/:courseId` | `course.instructor.equals(req.user._id)` | **200 OK** |
| **Instructor** | Delete other's course | `DELETE /api/v1/courses/:courseId` | `course.instructor !== req.user._id` | **403 COURSE_DELETE_FORBIDDEN** |
| **Admin** | Delete any course | `DELETE /api/v1/courses/:courseId` | `req.user.role === 'ADMIN'` | **200 OK** |
| **Admin** | Delete via Admin API | `DELETE /api/v1/admin/courses/:courseId` | `requirePermission('courses.publish')` | **200 OK** |
| **Student** | Attempt course delete | `DELETE /api/v1/courses/:courseId` | `req.user.role === 'STUDENT'` | **403 COURSE_DELETE_FORBIDDEN** |
| **Anonymous** | Attempt course delete | `DELETE /api/v1/courses/:courseId` | Missing / invalid Bearer token | **401 UNAUTHORIZED** |

---

## 5. Student Visibility Exclusions

Once soft-deleted, courses are completely invisible across student-facing entry points:

1. **Course Catalog (`GET /api/v1/courses`)**:
   Filtered via `{ isPublished: true, status: 'PUBLISHED', isDeleted: { $ne: true } }`.
2. **Global & Command Palette Search (`GET /api/v1/search?q=...`)**:
   Filtered via `{ status: 'PUBLISHED', isPublished: true, isDeleted: { $ne: true } }`.
3. **Student Course Detail Page (`GET /api/v1/courses/:slug`)**:
   Returns HTTP `404 COURSE_NOT_FOUND`. Frontend displays a friendly "Course Unavailable" state with a button to browse the active catalog.
4. **Learning Player (`GET /api/v1/courses/:courseId/curriculum`)**:
   Returns HTTP `404 COURSE_NOT_FOUND`.
5. **Dashboard Recommendations & Active Courses**:
   Filtered in `studentDashboard.service.js`, omitting deleted courses from active learning cards and recommended lists.
6. **AI Tools & Personalized Learning Paths**:
   Protected in `learningPathService.js`, `contentRecommendationService.js`, `recommendation.service.js`, and `aiToolRegistry.js`.

---

## 6. Dependency Handling

| Dependency | Action | Integrity Guarantee |
| :--- | :--- | :--- |
| **Course** | Soft-deleted (`isDeleted: true`) | Preserved for administrative audit & certificate references. |
| **Modules & Lessons** | Retired from public queries | Inaccessible via learning player and API routes. |
| **Vector Chunks (AI/RAG)** | Hard deleted (`VectorChunk.deleteMany`) | Prevents RAG retrieval and hallucinated course recommendations. |
| **Certificates** | **Strictly Preserved** | Earned credentials remain permanently verifiable via `/verify/:code`. |
| **Enrollments & Progress** | Retained in DB | Preserved for student transcripts; hidden from active dashboard discovery. |
| **Audit Logs** | Recorded in `AuditLog` | Details actor, role (`INSTRUCTOR` or `ADMIN`), course name snapshot, and timestamp. |

---

## 7. Frontend User Experience & Confirmation Safeguards

### Instructor Interface (`apps/instructor`)
- Course Edit Settings Danger Zone & Course Card Action Menu contain a destructive "Delete Course" button.
- Accessible modal requires the instructor to type the exact course title (case-insensitive) to confirm deletion.
- Prevents double submissions with disabled button states and "Deleting..." indicator.
- Automatically redirects to `/courses` upon completion.

### Admin Interface (`apps/admin`)
- Course Review Page Header & Courses Management Table contain a destructive "Delete Course" button.
- Accessible modal displays:
  - Course Name
  - Instructor Name
  - Number of Enrolled Students
  - Publication Status
  - Consequences & Safety Warning
  - Exact course name confirmation input
  - Loading state and redirect to `/courses`.
