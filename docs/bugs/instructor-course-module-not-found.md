# Bug Post-Mortem: Instructor Course Module "Course Not Found" Error

## Problem
When an authenticated Instructor navigated to the Course Studio to manage a course they created and attempted to add a module, edit a module, reorder modules, or perform related module operations, the server periodically responded with:

```json
{
  "success": false,
  "message": "Course not found.",
  "errorCode": "COURSE_NOT_FOUND"
}
```

This occurred even when:
- The course document existed in MongoDB.
- The course appeared in the Instructor dashboard course catalog.
- The course was authored and owned by the logged-in Instructor.
- The course edit studio initially loaded and opened without issue.

---

## Root Cause
The bug was caused by a combination of three interrelated defects in the data flow between frontend state management and backend route parameter resolution:

1. **Frontend Nested State Destructuring Discrepancy**:
   The backend API endpoint `GET /api/v1/instructor/courses/:courseId` returns an envelope structure:
   ```json
   {
     "success": true,
     "data": {
       "course": { "_id": "65f0a...", "title": "Node.js Mastery", "slug": "nodejs-mastery", ... },
       "modules": [...],
       "resources": [...],
       "metrics": { ... }
     }
   }
   ```
   In the instructor frontend (`apps/instructor/src/app/courses/[courseId]/edit/page.jsx`), `setCourse(data)` directly stored this root container object in the React `course` state. Consequently:
   - `course.modules` was populated (from `data.modules`).
   - `course._id` evaluated to `undefined` (because `_id` was actually nested under `data.course._id`).
   - When the instructor clicked "Save Module", `<CurriculumBuilder>` executed `addModule(accessToken, course._id, ...)`.
   - Since `course._id` was `undefined`, the fetch request was dispatched to:
     `POST /api/v1/instructor/courses/undefined/modules`.

2. **Backend Route Parameter Casting Failure**:
   In `apps/backend/src/middlewares/instructor.owner.middleware.js`, the `requireCourseOwner` middleware checked:
   ```javascript
   if (mongoose.Types.ObjectId.isValid(courseId)) {
     course = await Course.findById(courseId);
   } else {
     course = await Course.findOne({ slug: courseId });
   }
   ```
   Because the literal string `"undefined"` is not a valid 24-character hexadecimal `ObjectId`, the query fell back to searching for a slug equal to `"undefined"`. No course matches this slug, resulting in a `404 Course not found.` response.

3. **Slug vs. ObjectId Service Layer Incompatibility**:
   When instructors navigated directly via URL slug (e.g. `/courses/nodejs-mastery/edit`), `requireCourseOwner` resolved the course by slug. However, downstream services (specifically `courseService.addModule` and `reorderModules`) performed direct `Course.findById(courseId)` queries. Passing a slug string to `findById` triggers either a Mongoose `CastError` or returns `null`, erroneously resulting in `404 Course not found.`

---

## Affected Files
1. `apps/backend/src/middlewares/instructor.owner.middleware.js`
2. `apps/backend/src/services/instructor/course.service.js`
3. `apps/backend/src/services/instructor/student.service.js`
4. `apps/backend/src/services/instructor/analytics.service.js`
5. `apps/instructor/src/app/courses/[courseId]/edit/page.jsx`
6. `apps/instructor/src/components/curriculum/CurriculumBuilder.jsx`
7. `apps/instructor/src/app/courses/[courseId]/lessons/[lessonId]/edit/page.jsx`
8. `apps/instructor/src/app/courses/[courseId]/intelligence/page.jsx`

---

## Backend Fix
1. **Parameter Validation & Early Rejection**:
   Updated `requireCourseOwner` to explicitly validate route and body parameters:
   ```javascript
   const courseId = req.params.courseId || req.body.courseId;
   if (!courseId || courseId === 'undefined' || courseId === 'null' || (typeof courseId === 'string' && !courseId.trim())) {
     return res.status(400).json({
       success: false,
       message: 'Valid Course ID parameter is required.',
       errorCode: 'VALIDATION_ERROR',
     });
   }
   ```
   This prevents literal `"undefined"` strings from escaping into database queries and ensures clients receive a distinct `400 VALIDATION_ERROR` rather than a misleading `404 COURSE_NOT_FOUND`.

2. **Polymorphic Course Resolver (`findCourseByIdOrSlug`)**:
   Introduced a unified helper in `apps/backend/src/services/instructor/course.service.js`:
   ```javascript
   const findCourseByIdOrSlug = async (courseId) => {
     if (!courseId || courseId === 'undefined' || courseId === 'null') return null;
     if (mongoose.Types.ObjectId.isValid(courseId)) {
       return Course.findById(courseId);
     }
     return Course.findOne({ slug: courseId.toString().toLowerCase().trim() });
   };
   ```
   Applied this helper across `addModule`, `updateCourse`, `publishCourse`, `unpublishCourse`, `archiveCourse`, `duplicateCourse`, and `reorderModules`.

3. **Guaranteed Canonical ObjectId Association**:
   In `addModule` and `reorderModules`, module documents are strictly created and queried using `course._id` (the MongoDB `ObjectId`), ensuring `module.courseId` is never assigned a slug.

---

## Frontend Fix
1. **State Normalization in Course Editor**:
   In `apps/instructor/src/app/courses/[courseId]/edit/page.jsx`, normalized `fetchCourseDetail` response data:
   ```javascript
   const data = await fetchCourseDetail(accessToken, courseId);
   const courseObj = data?.course || data;
   const mergedCourse = {
     ...courseObj,
     modules: data?.modules || courseObj?.modules || [],
     resources: data?.resources || courseObj?.resources || [],
     metrics: data?.metrics || courseObj?.metrics || {},
   };
   setCourse(mergedCourse);
   ```
   This guarantees that `course._id`, `course.title`, `course.slug`, and `course.modules` exist at the root level of the `course` state.

2. **Defensive Target ID Extraction in CurriculumBuilder**:
   In `apps/instructor/src/components/curriculum/CurriculumBuilder.jsx`:
   ```javascript
   const courseIdVal = course?._id || course?.course?._id;
   ```
   Added client-side validation to guard against early requests: if `!courseIdVal || courseIdVal === 'undefined'`, the UI alerts the instructor and halts the request before dispatching network calls.

3. **Input State Preservation**:
   Preserved user-entered form inputs during errors so instructors do not lose drafted module titles or descriptions on submission retries.

---

## Authorization Fix
- Strict ownership checks remain fully enforced on both route middleware and service layers:
  ```javascript
  const isOwner = course.instructor && course.instructor.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. You do not have permission to manage this course.',
      errorCode: 'FORBIDDEN_COURSE_ACCESS',
    });
  }
  ```
- Any unauthorized attempts to manage another instructor's course (IDOR) strictly return `403 FORBIDDEN_COURSE_ACCESS`.

---

## Database Fix
- Standardized `module.courseId` as an indexed `mongoose.Schema.Types.ObjectId` referencing `Course`.
- Enforced `{ courseId: course._id }` on all module creations and updates to prevent corrupted or misaligned foreign keys.

---

## Tests
Integration and unit test suites were added to `apps/backend/tests/instructor.test.js`:
- `adds module to course and enforces ownership` (verifies module creation with valid ObjectId).
- `adds module using course slug instead of ObjectId` (verifies resolution via slug).
- `rejects adding module with invalid courseId parameter "undefined" with 400` (validates early 400 error).
- `returns 404 when adding module to nonexistent course` (distinguishes true 404 from invalid parameter).
- `prevents Instructor B from adding module to Instructor A course (IDOR)` (verifies 403 Forbidden).

---

## Prevention
1. **API Response Contracts**: Adopt unified DTO interfaces between backend controllers and frontend consumers.
2. **Strict Route Parameter Linting**: Disallow string fallbacks in parameter parsing without explicit validation against placeholder tokens (`"undefined"`, `"null"`).
3. **Automated Slug vs. ID Testing**: Require all course-bound API tests to run dual scenarios verifying both ObjectId and slug query parameters.
