# AI Context Isolation & Security (Phase 11)

## 1. Context Boundaries
To prevent data leakage, cost inflation, and context window pollution, AI prompts are supplied with only the minimum necessary metadata:
- **Current Course & Lesson**: Title and module name (never full raw transcripts of previous lectures).
- **Recent Mistake Concepts**: Relevant conceptual topic name and mistake category (never answer keys or confidential test cases).
- **Learning Goals**: Title of active student goal.

## 2. Prompt Injection Safeguards
- Untrusted student input and retrieved course notes are sanitized and wrapped in designated delimiters.
- Explicit system instructions enforce that curriculum content and user queries cannot override safety, grading, or role restrictions.
- Answers are never revealed directly when guided pedagogical reasoning is required.

## 3. Output Validation
When the AI assistant suggests next steps or practice problems:
1. The backend verifies that the suggested `resourceId` actually exists in the MongoDB database.
2. The backend confirms `isPublished: true` and verifies that the student has authorization to view the resource.
3. If the resource cannot be validated, the system automatically falls back to deterministic course sequence recommendations.
