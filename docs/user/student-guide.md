# Student User Guide

## 1. Getting Started & Account Creation
1. **Registration**:
   - Navigate to `http://localhost:3000/register` (or student domain in production).
   - Enter your name, email, and password (minimum 8 characters).
   - Or use 1-click test fill in development mode.
2. **Onboarding & Personalization**:
   - Complete your initial skill assessment and track selection (Frontend, Backend, Fullstack, AI Engineering).
   - Choose your career objectives (e.g. Full Stack Developer, Data Engineer) to generate an adaptive learning roadmap.

---

## 2. Navigating the Learning Platform
- **Student Dashboard (`/dashboard`)**:
  - **Continue Learning**: Direct one-click access to your in-progress course and last completed lesson.
  - **Streak & Stats**: Tracks continuous learning velocity, completed modules, and earned skills.
  - **Recommended Actions**: AI-curated practice problems, upcoming quizzes, and project milestones.
- **Course Catalog (`/courses`)**:
  - Search, filter by category (Fullstack, AI, Backend), difficulty level, and duration.
  - Preview free lessons before enrolling.
- **Curriculum Player (`/courses/:slug`)**:
  - Interactive video/reading lesson view with progress auto-save, note-taking, and instant navigation between modules.

---

## 3. Assessments & Algorithmic Practice
- **Assessments (`/assessments`)**:
  - Take timed quizzes, multiple-choice exams, and diagnostic knowledge benchmarks.
  - Review score breakdowns, correct explanations, and targeted skill gap remediation recommendations.
- **Coding Practice Sandbox (`/practice`)**:
  - Algorithm challenges with in-browser Monaco code editor.
  - Run code against test cases with execution timeouts and instant stderr/stdout feedback.

---

## 4. Career Ecosystem & Job Center
- **Career Hub (`/career`)**:
  - **Resume Builder (`/resume`)**: Create ATS-optimized resumes, export versions, and score against job descriptions.
  - **Job Board (`/jobs`)**: Filter verified openings, review salary ranges and requirements, and submit 1-click applications.
  - **Application Tracker (`/applications`)**: Follow application states (`APPLIED` -> `SCREENING` -> `INTERVIEW` -> `OFFER`).
  - **Mock Interviews (`/mock-interview`)**: Practice behavioral and technical interview questions with AI feedback.

---

## 5. Credentials & Portfolio
- **Certificates (`/certificates`)**:
  - Automatically issued upon 100% course completion.
  - Cryptographically verifiable public URLs shareable with recruiters (`/verify/:certificateId`).
- **Project Showcase (`/portfolio`)**:
  - Publish capstone projects with live demo links, GitHub repositories, and verified skill tags.
