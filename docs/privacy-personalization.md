# Privacy & Personalization Controls (Phase 11)

## 1. Student Privacy Controls
Students maintain full sovereignty over how their learning data informs platform features via `/settings/learning`:
- **Personalized Recommendations**: Toggles dynamic suggestions vs standard sequential course catalog.
- **AI Tutor Context**: Controls whether lesson titles, mistake notes, and weak topics are provided to AI prompts.
- **Adaptive Practice**: Toggles performance-calibrated spaced repetition intervals.
- **Weekly Review Synthesis**: Toggles factual weekly summary generation.

## 2. RBAC & Data Isolation
1. **Student-to-Student Isolation**:
   - Every student intelligence route (`/api/v1/student/*`) verifies `req.user._id === targetStudentId`.
   - Students cannot view or modify other students' mistake books, goals, or study plans (returns 403 or 404).
2. **Instructor Boundary**:
   - Instructors can only view intelligence for courses they teach (`requireCourseOwner`).
   - Learner data is presented in anonymized aggregate form (e.g., drop-off percentages, common mistake topics).
   - Instructors never see private AI chat transcripts, cross-course activity, or personal goals.
3. **Admin Boundary**:
   - Admin access to cluster learning health requires `analytics.read` permission.
   - Sensitive operations are logged in audit logs.
