# Learning Events & Telemetry Pipeline (Phase 11)

## 1. Event Pipeline Architecture
The learning event architecture logs student learning interactions asynchronously to prevent page latency while maintaining a reliable audit trail for intelligence analysis.

```
Student Action (Complete Lesson, Submit Quiz, Submit Code)
         │
         ▼
[LearningEventService.recordEvent]
         ├── Idempotency check via unique `eventId`
         ├── Ingestion to `LearningEvent` MongoDB collection
         ├── Daily streak increment & lastActiveDate calculation
         ├── Velocity metric updates (weekly count)
         ├── Badge criteria evaluation via `AchievementService`
         └── Goal incrementation via `GoalService`
```

## 2. Standard Event Types
- `LESSON_STARTED`: Logged when a student opens a lesson.
- `LESSON_COMPLETED`: Logged when video threshold is passed or manual mark complete.
- `QUIZ_STARTED`: Logged when an assessment attempt initializes.
- `QUIZ_SUBMITTED`: Logged on attempt scoring; feeds mistake log & weak topic detection.
- `CODING_ATTEMPTED`: Logged when test cases fail; feeds mistake log.
- `CODING_SOLVED`: Logged on `ACCEPTED` verdict; increments problem counts.
- `AI_SESSION`: Logged when asking AI Tutor questions.
- `GOAL_COMPLETED`: Logged when student reaches target milestones.
- `REVIEW_COMPLETED`: Logged when spaced revision intervals are completed.

## 3. Deduplication & Idempotency
- Events accept an optional client/service-supplied `eventId` (UUID).
- The service enforces idempotency by checking `LearningEvent.findOne({ eventId })` before inserting.
- Duplicate requests return the original event without double-counting streaks or goal progress.
