# Interview Preparation & Simulator Architecture

## 1. Overview
The Interview System delivers multi-category question banks and interactive AI mock interview simulations. It prepares learners for technical screenings, system design challenges, and behavioral STAR evaluations.

---

## 2. Categories
- **`TECHNICAL`**: Language internals, asynchronous runtimes, memory management, and database query tuning.
- **`SYSTEM_DESIGN`**: Scalability, caching strategies, partitioning, and microservice trade-offs.
- **`BEHAVIORAL`**: STAR framework (Situation, Task, Action, Result) questions measuring teamwork and conflict resolution.
- **`HR`**: Culture fit, career motivation, and compensation expectations.

---

## 3. Mock Interview Simulator (`InterviewSession`)
The simulator operates in single-question turns:
1. **Prompt Delivery**: AI presents one relevant question according to target role and difficulty.
2. **Student Submission**: Candidate enters their structured technical explanation.
3. **Automated Evaluation**:
   - **Relevance**: Evaluates whether core questions were addressed.
   - **Technical Coverage**: Compares student text against pre-configured `expectedTopics`.
   - **Actionable Feedback**: Identifies strengths, missed edge cases, and suggested terminology.
4. **Session Scorecard**: Once all questions are answered, an overall score and narrative feedback are recorded, advancing the student's `interviewPrepStatus`.
