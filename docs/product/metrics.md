# Platform Product Metrics Dictionary

This document standardizes product and operational metric definitions across all dashboards (Student, Instructor, and Admin). The same metric has an identical definition regardless of where it is rendered.

---

## 1. Engagement & Activation Metrics

| Metric Name | Formula / Definition | Data Source | Target / Frequency |
| :--- | :--- | :--- | :--- |
| **Student Activation** | `Account Created AND (First Lesson Completed OR Diagnostic Finished)` | `User`, `Progress`, `DiagnosticAttempt` | Real-time |
| **Learning Velocity** | Number of completed lessons or problems within a 7-day rolling window: `COUNT(completedLessons) / 7 days` | `Progress` | Daily aggregation |
| **Learning Streak** | Consecutive calendar days with at least 1 verified learning event (`LESSON_COMPLETED`, `QUIZ_SUBMITTED`, `CODING_SOLVED`) | `LearningEvent` | Daily calculation |
| **Course Completion Rate** | `(Enrolled Students with 100% Progress / Total Enrolled Students) * 100` | `Enrollment` | Real-time query |

---

## 2. Assessment & Skill Mastery Metrics

| Metric Name | Formula / Definition | Data Source | Target / Frequency |
| :--- | :--- | :--- | :--- |
| **Assessment Pass Rate** | `(Attempts with Score >= PassingThreshold / Total Submitted Attempts) * 100` | `AssessmentAttempt` | Per assessment |
| **Knowledge Gap Index** | Categorized list of sub-skills where student score falls below 60% across diagnostic or chapter quizzes | `LearningProfile`, `Mistake` | Computed on submission |
| **Spaced Review Mastery** | Flashcards or topics with 3+ consecutive successful recall iterations (`intervalDays >= 14`) | `SpacedReview` | Daily review cycle |

---

## 3. Career & Placement Funnel Metrics

| Metric Name | Formula / Definition | Data Source | Target / Frequency |
| :--- | :--- | :--- | :--- |
| **Job Application Conversion** | `(Job Applications Submitted / Unique Job Details Views) * 100` | `Job`, `JobApplication`, `LearningEvent` | Weekly cohort |
| **Interview Progression Rate**| `(Applications in INTERVIEW or OFFER state / Total Applied Applications) * 100` | `JobApplication` | Monthly |
| **ATS Match Score** | Cosine similarity or keyword match percentage between resume skills and job requirements (0-100%) | `Resume`, `Job` | On-demand scoring |

---

## 4. Operational & System Telemetry Metrics

| Metric Name | Formula / Definition | Data Source | Target / Frequency |
| :--- | :--- | :--- | :--- |
| **API Error Rate** | `(HTTP 5xx Responses / Total API Requests) * 100` | `observability.service` (`/metrics`) | Rolling 5-minute window (< 0.1%) |
| **AI Request Failure Rate**| `(Tripped Circuit Breakers + 5xx AI calls / Total AI Invocations) * 100` | `aiRouter` | Real-time (< 1.0%) |
| **Database Query Latency** | P95 duration of MongoDB query operations in milliseconds | Query profiling middleware | Target < 50ms |
