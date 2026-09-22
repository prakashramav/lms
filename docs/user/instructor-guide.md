# Instructor User Guide

## 1. Instructor Studio Overview
The Instructor Studio (`http://localhost:3001` or instructor domain in production) is designed for educators to design, publish, manage, and analyze comprehensive technical curricula.

---

## 2. Course Creation & Curriculum Authoring
1. **Course Creation**:
   - Navigate to `/courses` and click **"Create Course"**.
   - Input Course Title, Slug, Short Summary, Detailed Description, Category, and Difficulty Level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
2. **Modules & Lessons Hierarchy**:
   - Add structured Modules (e.g., "Module 1: React Fundamentals").
   - Within each module, add Lessons (Video lectures, reading materials, code sandboxes).
   - Set `isPreview: true` on introductory lessons to allow prospective students to audit before enrollment.
3. **Draft & Publishing Lifecycle**:
   - States: `DRAFT` -> `PENDING_REVIEW` -> `PUBLISHED` -> `ARCHIVED`.
   - Before submission, verify required thumbnails, module completeness, and assessment associations.

---

## 3. Designing Assessments & Quizzes
- Create multiple-choice questions, code-evaluation problems, and diagnostic quizzes.
- Assign passing scores (default: 70%) and time limits.
- Associate questions with granular skill tags to support automated student knowledge gap reporting.

---

## 4. Cohort Analytics & Student Intelligence
- **Cohort Management (`/cohorts`)**:
  - Group institutional or enterprise learners into dedicated tracks.
  - Track completion velocity, average student progress percentage, and at-risk learners.
- **Analytics Dashboard (`/analytics`)**:
  - Review enrollment trends, lesson drop-off heatmaps, quiz success rates, and student feedback sentiment.
