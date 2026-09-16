# Progress Tracking & Enrollment System

## Overview
Progress is calculated dynamically on the server and synced across lesson completions, video timestamps, and student dashboard metrics.

---

## 1. Enrollment Lifecycle (`Enrollment.js`)
- **Status Lifecycle**: `ACTIVE` -> `COMPLETED` (or `CANCELLED`)
- **Compound Unique Index**: `{ studentId: 1, courseId: 1 }` prevents duplicate enrollments.
- **Progress Tracking**:
  - `progressPercentage`: Calculated server-side based on `(completedLessonsCount / totalLessonsCount) * 100`.
  - `lastLessonId`: Stored to allow 1-click resume from the student dashboard.
  - `completedAt`: Automatically recorded when `progressPercentage === 100`.

---

## 2. Lesson Progress (`Progress.js`)
- **Compound Unique Index**: `{ studentId: 1, courseId: 1, lessonId: 1 }`
- **Fields**:
  - `lastPosition`: Time in seconds where video playback was left off.
  - `timeSpent`: Total accumulated seconds spent on lesson.
  - `isCompleted`: Boolean flag.
  - `startedAt`: Timestamp when lesson was first opened.
  - `completedAt`: Timestamp when marked complete.

---

## 3. Server-Side Progress Calculation
The backend never trusts client percentages. When a student calls `POST /api/v1/progress/lessons/:lessonId/complete`:
1. Server verifies student identity from JWT (`req.user._id`).
2. Server verifies the student is actively enrolled in the course.
3. Sets `isCompleted = true` and `completedAt = new Date()`.
4. Queries all published lessons belonging to the course.
5. Queries all completed `Progress` records for that student and course.
6. Calculates exact percentage: `Math.round((completedCount / totalLessonsCount) * 100)`.
7. Updates `Enrollment.progressPercentage`, `Enrollment.lastLessonId`.
8. If all lessons are finished, transitions `Enrollment.status = 'COMPLETED'` and sets `Enrollment.completedAt`.

---

## 4. Student Dashboard Telemetry Integration
The Phase 3 student dashboard (`/dashboard`) integrates directly with this progress engine:
- `ContinueLearningCard`: Shows the most recently interacted active course, current module, current lesson, progress bar, and percentage.
- `OverallProgressCard`: Aggregates total completed lessons across all enrolled courses.
- `RecommendedLearning`: Suggests topics based on current categories.
