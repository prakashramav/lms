# Learning Intelligence Architecture (Phase 11)

## 1. Overview
The Learning Intelligence system transforms the platform into an adaptive, personalized learning platform grounded in real student actions and verified curriculum entities.

```
Student Application
       │
       ▼
Learning APIs (/api/v1/student/...)
       │
       ▼
Learning Intelligence Service Layer
       ├── Progress & Velocity Analysis
       ├── Skill Mastery Evaluation (Graph-based)
       ├── Weak & Strong Topic Detection
       ├── Recommendation Engine (Priority + Explainable Reasons)
       ├── Daily Study Plan Generator
       ├── Spaced Revision Queue (1d → 3d → 7d → 14d → 30d)
       └── Mistake Notebook & Personal History
```

## 2. Core Tenets & Non-Punitive Feedback
1. **Never Fabricate Performance**: Recommendations and telemetry are computed strictly from real student events and database records.
2. **Never Hallucinate Resources**: Recommendations must reference active, published database entities (`Course`, `Lesson`, `Assessment`, `Problem`). If a resource does not exist, it is never recommended.
3. **Constructive Terminology**: The platform uses constructive, encouraging phrases such as `"Needs more practice"` rather than `"Poor performance"`, and `"May need support"` rather than labeling students negatively.
4. **Transparent Methodology**: Descriptive levels (`NOT_STARTED`, `INTRODUCED`, `PRACTICING`, `DEVELOPING`, `PROFICIENT`, `REVIEW_RECOMMENDED`) are presented as guideposts rather than absolute scientific precision.

## 3. Data Entities
- **LearningProfile**: Student skills, topic mastery, weak/strong topics, velocity, and personalization preferences.
- **Skill & StudentSkill**: Platform taxonomy and mastery states.
- **StudyPlan**: Realistic daily schedule with estimated duration and completion checkboxes.
- **Goal**: Student targets across courses, coding, assessments, and daily practice.
- **Mistake**: Record of incorrect answers, misconception context, and retry history.
- **SpacedReview**: Review queue with intervals based on performance.
- **Badge & StudentAchievement**: Backend-validated achievement awards.
