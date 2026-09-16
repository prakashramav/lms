# AI Technical Tutor & Personalized Learning Assistant

## Overview
The AI Tutor is an integrated, context-aware educational assistant that coaches students through course curriculum, coding problems, and assessments. Rather than functioning as an answer generator, the AI Tutor is built with a pedagogical mindset: explaining concepts, asking guiding questions, offering progressive hints, and helping students cultivate strong problem-solving habits.

---

## Key Features

### 1. Pedagogical Learning Modes
- **GUIDED (Default / Socratic):** Guides students toward discovering solutions themselves. If a student requests direct code ("give me the solution"), the tutor provides conceptual breakdowns, guiding questions, and pseudocode outlines rather than full code.
- **DIRECT:** Delivers concise, direct code solutions with complexity breakdowns and practical implementation notes.
- **EXPLANATION (Deep Dive):** Emphasizes system architecture, mental models, historical context, and trade-offs.

### 2. Conversational Memory & Scoped Context
The AI Tutor maintains context awareness:
- **Course Context:** Identifies active course title, category, and level.
- **Lesson Context:** Scopes explanations to the current lesson without blindly dumping whole courses into prompts.
- **Coding Context:** Ingests problem statements, constraints, student code, and execution telemetry without leaking hidden test cases.
- **Assessment Context:** Safeguards active assessments by withholding answer keys and focusing strictly on concept explanations.

### 3. Progressive 4-Tier Hints
When students encounter difficult coding problems, the hint engine progresses through four levels:
1. **Tier 1 (Conceptual):** Mental models and high-level strategy without implementation code.
2. **Tier 2 (Approach):** Step-by-step algorithmic approach and control flow.
3. **Tier 3 (Pseudocode):** Structural skeleton and loop termination logic.
4. **Tier 4 (Direct Guidance):** Specific boundary condition and syntax nuances.

### 4. Diagnostic Error Explanation
When runtime errors or test failures occur, the AI Tutor diagnoses:
- **What happened:** Plain-English summary.
- **Why it occurred:** Underlying language mechanics or type mismatches.
- **Where to look:** Specific lines or logic blocks.
- **How to debug:** Concrete debugging logs and sanity checks.
- **Possible correction:** Guiding advice on resolution.

### 5. Automated AI Code Review
Evaluates submissions against professional engineering standards:
- **Summary:** High-level architectural critique.
- **Highlights (Good):** Strengths in design, naming, and idioms.
- **Considerations (Consider):** Optimization opportunities.
- **Potential Issues (Potential Issue):** Memory overhead and edge case risks.
- **Practices to Avoid (Avoid):** Anti-patterns and magic constants.
- **Complexity Analysis:** Time and Space complexity in Big-O notation.

### 6. Lesson Summarizer & Study Planner
- **Lesson Summary:** Condenses lessons into definitions, key takeaways, and interview questions.
- **Personalized Study Plan:** Builds a custom schedule calibrated against platform enrollment and solved problems.

---

## User Interface

### Dedicated Chat Workspace (`/ai-tutor`)
- **Desktop:** Split-screen layout featuring a searchable conversation history sidebar on the left and interactive message stream on the right.
- **Mobile:** Slide-over drawer for switching chats, touch-friendly suggested prompts, and keyboard-accessible input.
- **Markdown & Code:** Formatted markdown with copyable syntax-highlighted code blocks.
- **Feedback:** Thumbs up / down feedback recorded per message.
- **Transparency:** Clear "AI-generated response • Verify important details" badges.
