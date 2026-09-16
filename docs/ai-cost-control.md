# AI Token Budgeting & Cost Control

## Overview
To prevent unexpected API billing spikes and ensure fair resource allocation among students, multi-layered cost controls and limits are enforced.

---

## Limits & Safeguards

### 1. Message Input Capping
- Maximum user message length: **5,000 characters**.
- Rejects oversized payloads with HTTP `400 PAYLOAD_TOO_LARGE`.

### 2. Context Window Capping
- Memory history window: Strictly limited to the **last 8 messages** per conversation.
- System prompts summarize or prune older interactions rather than accumulating boundless token history.

### 3. RAG Retrieval Budgeting
- RAG search results: Limited to top **3 chunks** (~600-800 words total).
- Scoped strictly to the active lesson or coding problem to minimize extraneous context tokens.

### 4. Generation Token Caps
- Completion tokens are capped at **1,500 tokens** per turn across Gemini and OpenAI requests.

### 5. Rate Limiting
- **API Rate Limiter:** 60 AI requests per minute per IP address.
- Returns HTTP `429 Too Many Requests` with friendly educational cooldown message.

### 6. Usage Accounting
- `AIMessage` records `tokenUsage`:
  ```javascript
  tokenUsage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  }
  ```
- Enables student usage telemetry and per-cohort token analytics.
