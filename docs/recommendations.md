# Recommendation Engine (Phase 11)

## 1. Objective
Delivers explainable, actionable recommendations to students based on:
1. Active course continuation (`CONTINUE_LESSON`).
2. Weak topic practice when assessment errors occur (`REVIEW_TOPIC`).
3. Coding challenges matched to practiced topics (`PRACTICE_PROBLEM`).
4. Course prerequisites and module sequence progression (`START_MODULE`).

## 2. Priority Calculation
Recommendation priority is calculated through explainable signals:
$$\text{Priority} = \text{Weak Topic Urgency} + \text{Course Sequence Progress} + \text{Student Goal Alignment}$$

- **Urgent Review (Priority 90)**: Triggered when accuracy on an assessment topic drops below 70% or repeated mistakes occur.
- **Immediate Next Step (Priority 85)**: Triggered for the next uncompleted lesson in the student's active enrolled course.
- **Skill Practice (Priority 70)**: High-rated coding problems corresponding to current curriculum categories.
- **Curriculum Expansion (Priority 60)**: Top-rated published courses aligned with the student's declared target role.

## 3. Explainability ("Why" Reasons)
Every recommendation card must present an explainable reason to the student:
- *"Because this lesson is next in your active curriculum sequence for Advanced React."*
- *"Because your recent assessment indicated you could benefit from more practice with JavaScript Promises."*
- *"Sharpen your coding skills with one of the most practiced challenges in Algorithms."*

## 4. Resource Integrity & Verification
Every recommendation strictly checks `isPublished: true` and verifies database ObjectId existence. If a course or lesson is archived or unpublished, it is excluded from generation.

## 5. Feedback Loop
Students can submit feedback (`HELPFUL`, `NOT_HELPFUL`, `NOT_RELEVANT`) or dismiss items (`DISMISSED`). Feedback is stored on the `Recommendation` entity and aggregated in platform analytics to refine heuristic weights.
