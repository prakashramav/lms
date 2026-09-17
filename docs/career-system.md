# Career Intelligence System Architecture

## 1. Overview
The Career Intelligence subsystem bridges student coursework, algorithmic practice, and project codebases directly into career discovery and job readiness. It establishes transparent readiness metrics and actionable skill gap matrices without false claims of guaranteed hiring.

---

## 2. Core Taxonomy & Progression
Platform career paths connect:
$$\text{Learning} \longrightarrow \text{Skills} \longrightarrow \text{Projects} \longrightarrow \text{Resume} \longrightarrow \text{Portfolio} \longrightarrow \text{Interview Prep} \longrightarrow \text{Jobs} \longrightarrow \text{Placement}$$

### Career Paths
- **Full Stack Developer** (`full-stack-developer`)
- **Frontend Developer** (`frontend-developer`)
- **Backend Developer** (`backend-developer`)
- **DevOps Engineer** (`devops-engineer`)
- **Data Analyst** (`data-analyst`)

---

## 3. Career Readiness Model
Readiness is calculated dynamically from five verifiable platform pillars (max 100 points):
1. **Skills Match (30 pts)**: Ratio of career path required skills marked as `PROFICIENT`, `DEVELOPING`, or `PRACTICING` in `StudentSkill`.
2. **Projects (25 pts)**: Verified showcase projects with GitHub repositories and live deployments.
3. **Resume (15 pts)**: Technical resume built and validated against ATS keyword completeness.
4. **Portfolio (15 pts)**: Portfolio showcase configured with verified experience and project demonstrations.
5. **Interviews (15 pts)**: Completion of multi-turn mock interview practice sessions.

> [!NOTE]
> Readiness scores are explainable progress indicators and strictly avoid presenting themselves as guaranteed employment odds or predictive placement percentages.

---

## 4. Skill Gap Categorization
When comparing a student's profile against target career requirements, skills are categorized into:
- **Already Practicing**: Skills verified through course completion, coding problems, or self-practice.
- **Needs Practice**: Introduced skills where recent assessments or spaced repetition indicate revision is recommended.
- **Not Started**: Required competencies not yet initiated in the curriculum.
- **Recommended Next**: The highest priority uncompleted prerequisite in the roadmap.

---

## 5. API Reference
- `GET /api/v1/career/paths`: Fetch all published career paths with required skills and recommended courses.
- `GET /api/v1/career/paths/:slug`: Retrieve full path details and roadmap stages.
- `GET /api/v1/career/roadmap/:careerPathId`: Retrieve ordered stage breakdown.
- `GET /api/v1/student/career-profile`: Retrieve student readiness score and breakdown.
- `POST /api/v1/student/career-profile/target`: Set or switch target career track.
- `GET /api/v1/student/skill-gaps`: Compute real-time skill gaps for active role.
