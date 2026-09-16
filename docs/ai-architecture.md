# AI Architecture & System Pipeline

## Architecture Overview
The AI Tutor follows a decoupled, resilient architecture designed to switch between LLM providers and operate offline without modifying controllers or application logic.

```
Student Next.js Client (/ai-tutor, IDE, LessonPlayer, Dashboard)
                           │
                           ▼
                 Express API Gateway
              (/api/v1/ai/* with Rate Limiter)
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      Authentication Check      Context Resolver
      (Bearer JWT Verification) (Course/Lesson/Problem)
              │                         │
              ▼                         ▼
       Ownership Check           RAG Semantic Search
      (IDOR Verification)       (VectorChunk Cosine Sim)
              │                         │
              └────────────┬────────────┘
                           ▼
                Prompt Engineering Layer
             (Tutor, Hint, Review, Summary)
                           │
                           ▼
                   AI Provider Layer
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   GeminiProvider    OpenAIProvider     MockAIProvider
   (Google Gemini)   (OpenAI REST)      (Deterministic)
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                  Response Formatter
           (Standard JSON or SSE Stream)
                           │
                           ▼
                  Conversation Storage
              (AIConversation, AIMessage)
```

---

## Component Layers

### 1. API & Security Layer
- Validates JWT tokens and student role permissions.
- Enforces strict conversation ownership checks preventing Insecure Direct Object References (IDOR).
- Rate limits traffic to 60 requests per minute per client.

### 2. Context Resolver
Enriches requests with human-readable learning context:
- Course name, category, and level.
- Lesson title, type, and module.
- Coding problem title, description, constraints, and test execution results.
- Protects active assessment attempt answers and private test cases.

### 3. RAG Semantic Search
- Queries `VectorChunk` collection prioritizing exact matches on the student's active lesson or problem.
- Calculates cosine similarity against query embeddings.
- Injects top-k most relevant curriculum passages into the prompt.

### 4. Provider Layer
- **GeminiProvider:** Communicates with Google Generative Language REST APIs (`gemini-1.5-flash`).
- **OpenAIProvider:** Communicates with OpenAI Chat Completions REST APIs (`gpt-4o-mini`).
- **MockAIProvider:** Deterministic engine providing offline development, zero-cost continuous integration, and instant test execution.

### 5. Server-Sent Events (SSE) Streaming
For real-time responses, `/api/v1/ai/conversations/:id/messages?stream=true` sets `text/event-stream` headers, flushing incremental tokens to the client before persisting final token usage and message documents in MongoDB.
