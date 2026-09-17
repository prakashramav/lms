# Phase 14 Personalization Engine Architecture

## 1. Overview
The Personalization Engine transforms static course consumption into a dynamic, adaptive learning experience that responds in real-time to student performance, strengths, weaknesses, and professional career goals.

## 2. Dynamic Learning Profile
Aggregated by `studentProfileService.js`, the student learning profile synthesizes multi-dimensional telemetry:
- **Active & Completed Courses**: Real-time progress, completion velocity, and lesson drop-off detection.
- **Skill Graph & Mastery Dimensions**:
  - `observedScore`: Quantifiable score derived from assessment questions and coding problems.
  - `selfReportedLevel`: Student self-assessment (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
  - `assessmentBasedLevel`: Calibrated level strictly determined by passing formal evaluations.
  - `aiEstimatedLevel`: Predictive heuristic estimation based on velocity and interaction patterns (explicitly separated from verified credentials).
- **Recent Mistakes & Weak Topics**: Tracks unmastered topics to prioritize targeted remediation.
- **Career Intent**: Aligned with target career paths (`Frontend Engineer`, `Full Stack Developer`, etc.).

## 3. Smart "Continue Learning" Engine
Instead of merely returning the last visited lesson ID, the engine calculates the optimal next action:
1. **Adaptive Concept Review**: If the student recently failed an assessment question on a prerequisite topic, the engine diverts to a focused micro-lesson or practice session.
2. **Sequential Progression**: If prerequisites are satisfied, advances to the next incomplete lesson.
3. **Capstone / Project Milestone**: If core lessons are completed, recommends building a portfolio project.
4. **Explainability**: Every recommendation includes explicit `reasonCodes` (e.g. `['PREREQUISITE_WEAKNESS', 'CAREER_GOAL']`) and human-readable explanations answering *"Why am I seeing this?"*.

## 4. AI Learning Coach (`aiCoach.service.js`)
Context-isolated assistant operating in 7 specialized modes:
1. `EXPLAIN`: Deconstructs complex conceptual topics into modular explanations with examples.
2. `PRACTICE`: Generates targeted scenario and debugging exercises matching current skill gaps.
3. `REVIEW`: Analyzes recent mistake history and suggests actionable revision.
4. `PLAN`: Generates realistic daily and weekly study milestones adjusted to student hours.
5. `DEBUG`: Diagnoses syntax, logic, and asynchronous issues without leaking unauthorized data.
6. `INTERVIEW`: Conducts mock technical question-and-answer dialogues for the target role.
7. `CAREER`: Audits resume keyword density, project portfolio impact, and job readiness.

## 5. Privacy & User Control
- **Audit Logs**: All AI prompts and context lookups run under authenticated tenant boundaries.
- **Transparency**: Students can view why any recommendation was made and dismiss or reconfigure goal parameters at any time.
