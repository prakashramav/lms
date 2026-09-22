# AI Safety, Guardrails & Privacy Architecture

## 1. Core Safety Principles
1. **Advisory Role**: AI outputs are strictly educational and advisory. AI never autonomously modifies grades, bans accounts, hires, or makes employment decisions.
2. **Context Isolation**:
   - **Student Isolation**: Student A's resumes, assessment submissions, and conversations can never be accessed or retrieved by Student B.
   - **Tenant Isolation**: Organization A's internal curriculum documents and private data cannot be retrieved by Organization B queries.
3. **Prompt Injection Defense**:
   - High-risk injection patterns (`SYSTEM OVERRIDE`, `Print environment variables`, `Ignore previous instructions`) are filtered.
   - Grounded context is isolated inside fenced, non-executable data blocks.

---

## 2. Guardrails Across Features

| Feature Domain | Primary Guardrail | Fallback / Failure Behavior |
| :--- | :--- | :--- |
| **Student Tutor** | Socratic progressive hints (Hint 1 -> Hint 2 -> Hint 3). Never dumps direct exam answers immediately. | Surfaces manual curriculum link if LLM fails. |
| **Coding Explainer** | Code snippets are analyzed statically; arbitrary user code is **never** executed inside the AI worker process. | Execution takes place solely within the isolated sandbox runner. |
| **ATS Resume Helper** | Never hallucinates fake jobs, fabricated degrees, or fraudulent employers. | Emphasizes existing verified course evidence and skill badges. |
| **Mock Interview** | Clearly states: *"Interview feedback is advisory and does not guarantee hiring outcomes."* | Provides structured criteria feedback (clarity, relevance, accuracy). |

---

## 3. Data Minimization & Privacy Rules
- **No Secret Logging**: Prompts and completions are sanitized to ensure API keys, database connection strings, and passwords are never persisted to disk or telemetry streams.
- **Conversation Controls**: Students maintain full ownership of AI chat history (`/api/v1/ai/conversations`) with clear options to view, delete, or archive sessions.
