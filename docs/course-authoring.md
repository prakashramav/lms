# Course Authoring & Curriculum Management Guide

## 1. Hierarchy & Structure
The ApexLearn Course Authoring system utilizes a hierarchical educational model:
```
Course
├── Module 1: Foundations & Architecture
│   ├── Lesson 1: Article / Concept Breakdown
│   ├── Lesson 2: Video Tutorial Stream
│   ├── Lesson 3: Live Code Sandbox
│   └── Assessment: Knowledge Check Quiz
├── Module 2: Advanced Systems & Scaling
│   ├── Lesson 1: Architecture Deep Dive
│   └── Coding Practice: Algorithmic Challenge
```

---

## 2. Course Lifecycle States
Every course transitions through three states:
1. **`DRAFT`**: Authoring stage. Invisible to general students in catalog search and enrollment. Instructors can modify curriculum, reorganize lessons, and preview lessons without mutating student progress.
2. **`PUBLISHED`**: Verified and accessible. Available to students for enrollment, learning, and automated grading.
3. **`ARCHIVED`**: Retired course. Hidden from discovery, but existing student progress and submissions remain protected and accessible to already enrolled students.

---

## 3. Publication Readiness Checklist
Before a course can be transitioned from `DRAFT` to `PUBLISHED`, the system runs a server-side validator requiring:
- Title at least 5 characters.
- Short summary tagline at least 20 characters.
- Full pedagogical description at least 50 characters.
- Valid unique slug identifier.
- At least one module created.
- At least one published lesson with content.

---

## 4. Rich Content & Code Sandboxes
Lessons support:
- **Markdown & Structured Text**: Headers, bullet lists, blockquotes, images, and tables.
- **Embedded Video Streams**: YouTube, Vimeo, Cloudinary, or direct MP4 streams. Video media is hosted via external providers to prevent database bloat.
- **Syntax-Highlighted Code Blocks**: Syntax highlighting for JavaScript, TypeScript, Python, Java, C++, and HTML/CSS.
- **Downloadable Resources**: PDF documents, slide presentations, and starter boilerplate archives.

---

## 5. Assessments & Question Bank
Quizzes integrate with the Phase 5 automated scoring engine:
- **Supported Question Types**:
  - Single Choice (MCQ)
  - Multiple Select
  - True / False
  - Short Answer
- **Answer Security**: Correct answers and rationales are stored securely on the backend. When students take an assessment, the student API sanitizes `correctAnswers` and explanations.

---

## 6. Coding Practice & Test Cases
Algorithmic challenges integrate with the Phase 6 automated judge:
- **Public Test Cases**: Visible in student preview to help debug solution logic.
- **Hidden Test Cases**: Never returned to student clients. Used during submission evaluation to prevent hardcoded solutions.
- **Publishing Safeguard**: At least one public and one hidden test case are mandatory before publication.

---

## 7. AI Pedagogical Assistant
Instructors can launch the AI Authoring Assistant to draft:
- Lesson Outlines
- Quiz Questions
- Algorithmic Challenges

All AI outputs remain in an editable sandbox modal. Instructors must review and approve generated items before adopting them.
