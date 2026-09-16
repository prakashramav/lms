# Student Learning Management System (LMS)

## Overview
The student learning environment provides a responsive, distraction-free interface for consuming video lessons, interactive articles, and downloadable curriculum resources.

---

## Architecture & Layout

### 1. Desktop Experience (`/learning/[courseId]`)
- **Top Header**: Course title, category, track level, overall progress percentage bar, and direct exit link.
- **Main Content Area (Left 66-75%)**:
  - `LessonPlayer`:
    - Video playback: Custom controls (Play/Pause, Seek bar, 10s Rewind, Volume slider + Mute toggle, Playback Speed 0.75x–2x selector, Fullscreen toggle).
    - Auto-resume from `lastPosition` stored in `Progress`.
    - Periodic progress throttle (every 5 seconds) sending `PATCH /api/v1/progress/lessons/:lessonId`.
    - Article/Reading Mode: Formatted reading viewport with study content.
    - Resources section: Downloadable docs, PDF links, and GitHub reference links.
  - **Lesson Action Toolbar**:
    - "Previous Lesson" button (auto-disabled on first lesson).
    - "Mark Complete" / "Completed" toggle button.
    - "Next Lesson" button (auto-disabled on last lesson).
- **Curriculum Sidebar (Right 25-33%)**:
  - `CurriculumAccordion` listing all ordered modules and lessons.
  - Visual status markers:
    - Green checkmark for completed lessons.
    - Brand dot for current active lesson.
    - Lock icon for non-preview lessons if unenrolled.
    - Amber "Preview" pill for free preview lessons.

### 2. Mobile Experience (`< 1024px`)
- **Mobile First Hierarchy**:
  1. Course Header & Navigation
  2. Progress bar
  3. Lesson Video Player / Article Viewer
  4. Lesson Title & Overview
  5. Lesson Resources & Downloads
  6. Sticky / Bottom Previous • Mark Complete • Next toolbar
  7. Slide-over / Curriculum Drawer: Accessible via the "Curriculum" button, avoiding permanently consuming screen real estate on mobile devices.

---

## Lesson Access Control Matrix
| User State | Lesson `isPreview = true` | Lesson `isPreview = false` |
|---|---|---|
| Unauthenticated / Guest | Accessible (video + content) | 🔒 Locked ("Enroll to unlock") |
| Authenticated (Not Enrolled) | Accessible (video + content) | 🔒 Locked ("Enroll to unlock") |
| Enrolled Student | Accessible | Accessible |
| Enrolled Student (Completed) | Accessible | Accessible |
