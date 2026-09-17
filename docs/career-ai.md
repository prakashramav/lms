# Career AI Assistant & Safety Boundaries

## 1. Overview
The Career AI Assistant provides grounded career coaching, resume audits against specific job descriptions, and interview answer evaluations.

---

## 2. Hallucination Safeguards & Data Isolation
The Career AI adheres to strict safety boundaries:
1. **No False Employment Guarantees**: Prompts explicitly forbid promising job offers, specific salary tiers, or guaranteed interview invitations.
2. **Context Grounding**: AI is supplied only with verified database records (student's enrolled courses, mastered skills, real job descriptions).
3. **Tenant & Data Boundaries**:
   - Student AI accesses solely the current authenticated student's data.
   - Resumes, private applications, and recruiter notes from other users are strictly excluded from context.
4. **Offline & Fallback Safety**: If external LLM providers fail or timeout, deterministic fallback templates guarantee uninterrupted platform operation.
