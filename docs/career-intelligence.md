# Phase 14 Career Intelligence & Placement Ecosystem

## 1. Overview
The Career Intelligence system bridges the gap between educational achievement and industry hiring by correlating verified skills with role requirements, portfolio depth, and employer talent acquisition pipelines.

## 2. Career Path Explorer & Skill Gap Engine
- **Supported Roles**: Frontend Developer, Backend Developer, Full Stack Developer, Data Analyst, Data Scientist, ML Engineer, DevOps Engineer, Cloud Engineer, Cybersecurity Specialist.
- **Skill Gap Computation (`careerRecommendationService.js`)**:
  - Compares student's mastered skills (`INTERMEDIATE`, `ADVANCED`, `MASTERED`) with career prerequisites.
  - Generates clear, non-opaque comparisons (e.g., Matched: React, JavaScript; Missing: Docker, AWS).
  - Produces a 5-phase career roadmap (`Foundation` -> `Core Skills` -> `Projects & Portfolio` -> `Interview Preparation` -> `Job Applications`).

## 3. Employer ATS Kanban Board & Pipeline
- **Pipeline Stages**:
  `APPLIED` -> `SCREENING` -> `SHORTLISTED` -> `INTERVIEW` -> `ASSESSMENT` -> `OFFER` -> `REJECTED` / `WITHDRAWN`
- **Audit Logging**: Every stage transition records actor ID, role (`EMPLOYER`), previous and new stage, and optional reviewer notes into `AuditLog`.
- **Candidate Privacy**: Candidates retain visibility over their application statuses while employers only access information granted by the applicant.

## 4. Transparent Job Matching
- Job recommendations and match scores avoid arbitrary percentages by explaining criteria:
  - Required skills match breakdown.
  - Years of practical experience requirements.
  - Remote/onsite preferences.
