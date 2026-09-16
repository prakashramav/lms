# Student UI Shell & Dashboard Documentation

## 1. Overview
The Student Application (`apps/student`) provides the core learning, coding, and career acceleration interface for students. Phase 3 introduces the global application layout, responsive navigation systems, theme engine, and the comprehensive student dashboard connected to the backend API.

---

## 2. Navigation Architecture

### Desktop Layout
- **Fixed / Collapsible Sidebar (`Sidebar.jsx`)**:
  - Main items: Dashboard, Learn, Practice, Projects, AI Tutor, Interview, Career, Jobs.
  - Secondary items: Notifications, Profile, Settings.
  - Footer actions: Help Center, Sign Out.
  - Persists collapsed state to `localStorage.apex_sidebar_collapsed`.
  - Icon-only view provides quick tooltips on hover.
- **Top Header (`StudentHeader.jsx`)**:
  - Global Search trigger with `Cmd/Ctrl + K` quick palette.
  - Theme mode switcher (`Light`, `Dark`, `System`).
  - Notifications dropdown with unread badges and quick mark-read.
  - User profile menu displaying authenticated student credentials and role.

### Mobile Layout
- **Bottom Navigation Bar (`MobileNav.jsx`)**:
  - 5 primary touch-friendly navigation anchors (min 44px touch targets): Home, Learn, Practice, AI, Career.
  - "More" button opening a bottom slide-up drawer for secondary tools (Projects, Interview, Jobs, Profile, Settings, Logout).

---

## 3. Student Dashboard Components

The Dashboard page (`/dashboard`) integrates 10 dedicated presentation components:
1. **Welcome Section**: Personalized greeting based on time of day, student name from JWT auth, active streak counter, and target career role.
2. **Quick Action Shortcuts**: Direct 1-click links to live tools (Learn, Sandbox, AI Tutor, Interview, Projects, Jobs).
3. **Continue Learning Primary Card**: Active course, level, module, lesson, and real-time completion percentage with progress bar.
4. **Overall Progress Card**: Summary metrics for total completed lessons, focused study hours, and pending assignments.
5. **Daily Goals Card**: Dynamic 5-task checklist with progress percentage.
6. **Consistency Streak Card**: 7-day visual activity matrix and current streak counter.
7. **Recommended Learning**: Algorithmic course recommendations tailored to the student's career track.
8. **Pending Tasks & Deadlines**: Priority queue of upcoming quizzes, assignments, and milestone deliverables with status badges.
9. **Recent Activity Stream**: Chronological audit trail of passed tests, completed lessons, and earned scores.
10. **Career Readiness Profile**: Skill progress breakdown across core technologies with qualitative indicators (`Strong`, `Good`, `Developing`, `Needs Practice`).

---

## 4. Backend Dashboard API

### Endpoint: `GET /api/v1/student/dashboard`
- **Authentication**: Requires valid Bearer JWT Access Token.
- **Authorization**: Strictly enforced for role `STUDENT`. Rejects `INSTRUCTOR` and `ADMIN` with `HTTP 403 Forbidden`.
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "66f42a...",
      "name": "Alex Rivera",
      "email": "student@example.com",
      "role": "STUDENT",
      "targetRole": "Full Stack Software Engineer"
    },
    "currentCourse": {
      "title": "Full Stack Software Engineering",
      "currentLevel": "Level 3: Modern JavaScript",
      "currentModule": "Asynchronous Programming",
      "currentLesson": "Mastering Async/Await",
      "progressPercentage": 78
    },
    "progress": {
      "overallPercentage": 78,
      "completedLessons": 32,
      "totalLessons": 42,
      "pendingAssignments": 3,
      "hoursLearned": 54.5
    },
    "dailyGoal": { "total": 5, "completed": 3, "tasks": [...] },
    "streak": { "currentDays": 12, "weeklyActivity": [...] },
    "pendingTasks": [...],
    "recentActivity": [...],
    "recommendations": [...],
    "career": { "targetRole": "...", "skills": [...] }
  }
}
```

---

## 5. Responsive Breakpoint Optimization
- **320px - 640px (Mobile)**: Single-column stacked layout, collapsible drawers, sticky bottom navigation.
- **768px - 1024px (Tablet)**: Two-column grid, responsive header, collapsed sidebar.
- **1024px+ (Desktop)**: Three-column dashboard layout, full collapsible sidebar, command palette search.
