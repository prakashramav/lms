# Assessment, Quiz & Assignment Architecture

## Overview
The Assessment system provides students with timed quizzes, module checkpoints, practice tests, and course final assessments. It features server-enforced duration, anti-tampering answer validation, real-time debounced auto-saving, and automated server-side evaluation.

---

## Data Models

### 1. Assessment (`Assessment.js`)
- **Fields**:
  - `title` (String, required)
  - `slug` (String, unique, lowercase)
  - `description` (String)
  - `instructions` (String)
  - `courseId` (ObjectId ref `Course`, optional)
  - `moduleId` (ObjectId ref `Module`, optional)
  - `lessonId` (ObjectId ref `Lesson`, optional)
  - `type` (`QUIZ` | `PRACTICE_TEST` | `MODULE_ASSESSMENT` | `COURSE_ASSESSMENT` | `CODING_ASSESSMENT` | `PROJECT_ASSESSMENT` | `INTERVIEW_ASSESSMENT`)
  - `difficulty` (`Beginner` | `Intermediate` | `Advanced`)
  - `duration` (Number in minutes, default: 30)
  - `passingScore` (Percentage number, default: 70)
  - `totalMarks` (Number, default: 0)
  - `maxAttempts` (Number, 0 = unlimited, default: 3)
  - `shuffleQuestions` (Boolean, default: false)
  - `shuffleOptions` (Boolean, default: false)
  - `showResultsImmediately` (Boolean, default: true)
  - `showCorrectAnswers` (Boolean, default: true)
  - `status` (`DRAFT` | `PUBLISHED` | `ARCHIVED`)
  - `isPublished` (Boolean)
  - `createdBy` (ObjectId ref `User`)
- **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ status: 1 }`
  - `{ isPublished: 1 }`
  - `{ courseId: 1 }`
  - `{ moduleId: 1 }`

### 2. Question (`Question.js`)
- **Fields**:
  - `assessmentId` (ObjectId ref `Assessment`, required, indexed)
  - `question` (String, required)
  - `type` (`SINGLE_CHOICE` | `MULTIPLE_CHOICE` | `TRUE_FALSE` | `SHORT_ANSWER`)
  - `options` (Array of `{ id: String, text: String }`)
  - `correctAnswers` (Array of Strings, e.g. `["a"]` or `["a", "c"]` or `["true"]`)
  - `explanation` (String, pedagogical breakdown of solution)
  - `marks` (Number, default: 1)
  - `difficulty` (`Beginner` | `Intermediate` | `Advanced`)
  - `topic` (String)
  - `order` (Number, default: 0)
  - `isActive` (Boolean, default: true)
- **Indexes**:
  - Compound Index: `{ assessmentId: 1, order: 1 }`

### 3. AssessmentAttempt (`AssessmentAttempt.js`)
- **Fields**:
  - `studentId` (ObjectId ref `User`, required, indexed)
  - `assessmentId` (ObjectId ref `Assessment`, required, indexed)
  - `startedAt` (Date, default: Date.now)
  - `submittedAt` (Date, default: null)
  - `status` (`IN_PROGRESS` | `SUBMITTED` | `ABANDONED` | `EXPIRED`)
  - `score` (Number, default: 0)
  - `percentage` (Number, default: 0)
  - `passed` (Boolean, default: false)
  - `totalQuestions` (Number, default: 0)
  - `answeredQuestions` (Number, default: 0)
  - `correctAnswers` (Number, default: 0)
  - `incorrectAnswers` (Number, default: 0)
  - `timeSpent` (Number in seconds)
  - `attemptNumber` (Number, default: 1)
  - `answers`: Array of `{ questionId, selectedAnswers, isCorrect, marksAwarded, answeredAt }`
- **Indexes**:
  - `{ studentId: 1, assessmentId: 1 }`
  - `{ studentId: 1, createdAt: -1 }`
  - `{ assessmentId: 1, createdAt: -1 }`

---

## Attempt Lifecycle & State Transitions
```
                ┌────────────────────────────────┐
                │          IN_PROGRESS           │
                │   (Answers auto-saved /        │
                │    browser refresh recovery)   │
                └───────┬────────────────┬───────┘
                        │                │
            Student     │                │  Timer Elapsed
            Submits     ▼                ▼  (Duration Exceeded)
                 ┌─────────────┐   ┌─────────────┐
                 │  SUBMITTED  │   │   EXPIRED   │
                 └─────────────┘   └─────────────┘
```

1. **Starting Attempt**:
   - Authenticated student starts attempt.
   - Server checks `maxAttempts` and active course enrollment.
   - If an `IN_PROGRESS` attempt already exists and is unexpired, the server restores it seamlessly (preventing accidental duplicate attempts on page reload).
   - Server responds with **safe questions** (stripping `correctAnswers` and `explanation`).
2. **Auto-Saving Answers**:
   - Each option selection debounces a `PATCH /api/v1/assessments/attempts/:attemptId/answers` request.
   - Server verifies ownership and status before persisting answers.
3. **Submitting & Evaluation**:
   - Evaluated server-side via `POST /api/v1/assessments/attempts/:attemptId/submit`.
   - Repeated submission requests return existing evaluated scores (idempotency).
