# Instructor Course Deletion Specification

## 1. Overview
The Course Deletion feature enables instructors and administrators to permanently delete a course that is deemed unsuitable or obsolete. To protect platform integrity, prevent accidental data loss, and maintain student credential validity, the deletion workflow integrates UI safeguards (double-confirmation with title verification) and atomic backend cascade operations.

---

## 2. Who Can Delete
- **Instructors**: Can delete **only** courses where they are the verified owner (`course.instructor.equals(req.user._id)`). Any attempt by Instructor A to delete Instructor B's course is rejected with HTTP `403 FORBIDDEN`.
- **Platform Administrators**: Have administrative override capability via authorized roles (`admin`, `superadmin`).
- **Students, Mentors, and Unauthenticated Users**: Cannot delete any course; all endpoints reject them with HTTP `401` or `403`.

---

## 3. How Deletion Works

### Frontend User Experience
1. **Destructive Action Trigger**: On the Course Edit Settings tab (`/courses/[courseId]/edit`) and the Course List card action menu (`/courses`), a red destructive "Delete Course" button is displayed.
2. **Double-Confirmation Modal**:
   - Displays an explicit list of permanent consequences.
   - Requires the user to type the exact course title (case-insensitive string comparison) before the "Delete Permanently" button activates.
   - Fully accessible: supports `Escape` key close, focus trap, and keyboard navigation.
3. **Optimistic Guard & Loading State**:
   - Disables all buttons during request execution.
   - Shows "Deleting..." loading state to prevent double submissions.
4. **Post-Deletion Redirect**:
   - Instructors on the edit page are navigated immediately back to `/courses`.
   - On the course list page, the deleted course is instantaneously filtered out of state, accompanied by a success toast.

### Backend Execution Flow
1. **Route**: `DELETE /api/v1/instructor/courses/:courseId`
2. **Authentication Middleware**: Verifies Bearer JWT and sets `req.user`.
3. **Authorization Middleware (`requireCourseOwner`)**:
   - Validates that `courseId` is not `"undefined"`, `"null"`, or empty (returns HTTP `400 VALIDATION_ERROR`).
   - Resolves course by ObjectId or Slug.
   - Enforces `course.instructor.toString() === req.user._id.toString()`. Returns HTTP `403` if unauthorized.
4. **Cascade Service (`courseService.deleteCourse`)**:
   - Executes cascade operations across all child collections.
   - Writes an immutable record to the `AuditLog` collection.
   - Emits an event / logs the deletion for downstream cache or search updates.
   - Returns `{ success: true, message: "Course and associated content deleted successfully", deletedCourseId }`.

---

## 4. Dependent Data Handling

| Entity / Resource | Action Taken | Rationale |
| :--- | :--- | :--- |
| **Course** | **Hard Deleted** (`Course.findByIdAndDelete`) | Permanently removed from MongoDB. |
| **Modules** | **Hard Deleted** (`Module.deleteMany({ courseId })`) | Dependent structural entities tied strictly to this course. |
| **Lessons** | **Hard Deleted** (`Lesson.deleteMany({ courseId })`) | Individual content units tied strictly to this course. |
| **Assessments & Quizzes** | **Hard Deleted** (`Assessment.deleteMany({ courseId })`) | Course-specific tests and evaluations. |
| **Resources & Attachments** | **Hard Deleted** (`Resource.deleteMany({ courseId })`) | Metadata records referencing files specific to this course. |
| **Student Progress** | **Deleted** (`Progress.deleteMany({ courseId })`) | Student progress in this specific course is reset/purged. |
| **Enrollments** | **Deleted** (`Enrollment.deleteMany({ courseId })`) | Prevents ghost enrollments or orphaned dashboard entries. |
| **Feedback & Reviews** | **Deleted** (`Feedback.deleteMany({ courseId })`) | Course ratings are cleaned up so average aggregates are unaffected. |
| **Certificates** | **PRESERVED** | Student credentials and verifiable certificates must remain valid for portfolio/verification purposes. |
| **Vector Chunks (AI/RAG)** | **Deleted** (`VectorChunk.deleteMany({ courseId })`) | Prevents hallucinated citations from deleted course contents. |
| **Student Bookmarks** | **Deleted** (`Bookmark.deleteMany({ courseId })`) | Prevents broken navigation links in student bookmarks. |

---

## 5. Certificates Preservation Policy
- **Student Integrity**: Certificates previously earned by students for this course are **NEVER deleted**.
- **Self-Contained Verification**: The `Certificate` schema contains embedded snapshots of `courseTitle`, `studentName`, `issueDate`, and unique verification codes.
- **Verification Endpoint**: Third parties verifying credentials against `/verify/:code` continue to resolve the historical credential without dependency on the active course document.

---

## 6. Historical Analytics
- Aggregated financial and platform-wide metrics (such as completed payouts or aggregated platform enrollment totals in historical month summaries) are preserved.
- Direct course-level active queries will return empty / 0 rather than erroring out due to canonical ID and slug safety checks.

---

## 7. AI Indexes and Search Cleanup
- When a course is deleted, `VectorChunk.deleteMany({ courseId })` purges all embedded chunks stored for RAG / semantic search.
- Any search index lookup filtering by active courses immediately drops the course since the primary document no longer exists.

---

## 8. Uploaded Files and Storage Safety
- Resource records are deleted from the database.
- Any shared asset libraries or CDN assets linked across multiple entities are preserved to avoid breaking external references, while unique single-course files are dereferenced.

---

## 9. Audit Logging
Every deletion records an audit trail in the `AuditLog` collection:
```json
{
  "action": "COURSE_DELETE",
  "actorId": "instructor_user_id",
  "actorRole": "instructor",
  "targetId": "course_object_id",
  "targetType": "Course",
  "metadata": {
    "courseTitle": "Course Name Snapshot",
    "courseSlug": "course-name-snapshot",
    "deletedAt": "2026-09-20T11:00:00.000Z"
  }
}
```
This guarantees administrative accountability and forensics even after the primary course document is removed.
