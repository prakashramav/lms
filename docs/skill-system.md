# Skill Graph & Mastery Taxonomy (Phase 11)

## 1. Skill Taxonomy Structure
Skills are organized hierarchically across core engineering categories:
- `FRONTEND`: JavaScript Fundamentals, Asynchronous JavaScript, React Components & Hooks, Next.js Architecture.
- `BACKEND`: Node.js & Express REST APIs, System Architecture, Middleware Design.
- `DATABASE`: Database Modeling & Mongoose, Index Optimization, Aggregation Frameworks.
- `ALGORITHMS`: Data Structures & Algorithms, Two-Pointer Techniques, Dynamic Programming.

## 2. Mastery Levels
Student skill proficiency is tracked via `StudentSkill` using descriptive states:
1. `NOT_STARTED`: The learner has had 0 exposure to assessment questions or coding problems under this skill.
2. `INTRODUCED`: 1 to 2 practice/assessment attempts recorded.
3. `PRACTICING`: 3 to 6 interactions logged; foundations are developing.
4. `DEVELOPING`: Consistent practice with 70% - 84% accuracy.
5. `PROFICIENT`: Consistent success with $\ge 85\%$ accuracy across challenges.
6. `REVIEW_RECOMMENDED`: Accuracy has dropped below 70% or over 30 days have elapsed since last practice.

## 3. Transparency & Presentation
- **Desktop UI**: Displays an interactive, responsive skill matrix with category filters and direct "Reinforce Skill" actions.
- **Mobile UI**: Compact, non-overlapping cards with color-coded status badges and practice buttons.
- The interface explicitly informs students that mastery states are activity-derived guideposts rather than absolute measurements.
