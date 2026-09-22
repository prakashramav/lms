# AI Learning Intelligence Architecture

## 1. Modular AI Layer Overview
The platform's AI ecosystem operates as an assistive, guardrailed copilot layer rather than an autonomous decision-maker. It is structured into clear functional domains located within `apps/backend/src/services/ai/`.

```mermaid
flowchart TD
    User([Student / Instructor / Admin]) -->|Prompt & Context Token| Ingress[AI Controller & Gateway]
    Ingress -->|Auth & Role Check| Guard[RBAC & Rate Limiting Guard]
    Guard -->|Context Isolation| RAG[RAG & Vector Retrieval Engine]
    RAG -->|Sanitized System Prompt| Router[Resilient AI Router & Circuit Breaker]
    Router -->|Primary| Gemini[Google Gemini 1.5 Provider]
    Router -.->|Fallback 1| OpenAI[OpenAI GPT-4o Provider]
    Router -.->|Fallback 2| Mock[Deterministic Fallback Mock]
    Router -->|Raw Output| Val[Output Schema & Safety Validator]
    Val -->|Verified Response| User
```

---

## 2. Core Components

1. **Provider Abstraction (`aiRouter.js`)**:
   - Manages model switching across Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o`), and resilient mock fallback.
   - Built-in 3-strike circuit breaker with a 60-second cooldown timer.
2. **AI Tool Registry (`aiToolRegistry.js`)**:
   - Strict server-side permission registry. Tools can only read authorized student data (`getStudentProgress`, `getSkillProfile`, `searchJobs`).
   - Tools are barred from destructive mutations (cannot delete accounts, issue refunds, alter course states, or tamper with grades).
3. **Retrieval-Augmented Generation (RAG)**:
   - Chunked document indexing in `vectorChunk.model.js`.
   - Filters retrieved chunks strictly by student enrollment and tenant boundaries, preventing cross-student and cross-organization context leakage.
4. **Safety & Guardrails**:
   - Prompt injection containment: Retrieved content is treated strictly as raw data rather than executable instructions.
   - Grounded explanations: When information is missing, the assistant outputs `"I don't have enough information"` instead of hallucinating.
