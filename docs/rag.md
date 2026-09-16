# Retrieval-Augmented Generation (RAG) & Vector Storage

## Overview
The RAG pipeline grounds the AI Tutor in real platform curriculum, lesson content, and problem specifications—minimizing hallucinations and ensuring explanations directly reinforce what students are studying.

---

## Data Pipeline

### 1. Ingestion & Sanitization
1. **Source Content:** Courses, published lessons, and problem statements are ingested.
2. **Credential Redaction:** Sanitization filters out passwords, tokens, API keys, and environment references.
3. **Hidden Test Stripping:** Hidden test cases and private evaluation harnesses are strictly omitted before chunking.

### 2. Semantic Chunking
- Text is split into overlapping chunks (~200 words with 40-word overlap).
- Chunks preserve structural headers and context metadata.

### 3. Vector Embeddings
- `EmbeddingProvider` converts text into normalized 64-dimensional vectors.
- Supports cosine similarity search in memory or MongoDB Atlas Vector Search if enabled.

### 4. Scoped Hierarchical Retrieval
When a student asks a question, the query vector is compared against candidates with context boosts:
1. **Lesson Scope (+0.25 boost):** Chunks from the active lesson.
2. **Problem Scope (+0.25 boost):** Chunks from the active coding problem guide.
3. **Course Scope (+0.15 boost):** Chunks from sibling lessons in the active course.
4. **Platform Scope:** Broader platform curriculum if scoped matches are insufficient.

---

## Database Schema (`VectorChunk`)

```javascript
{
  documentType: 'LESSON' | 'COURSE' | 'PROBLEM' | 'ASSESSMENT_TOPIC',
  courseId: ObjectId,
  moduleId: ObjectId,
  lessonId: ObjectId,
  problemId: ObjectId,
  title: String,
  content: String,
  tokensCount: Number,
  embedding: [Number],
  metadata: Object,
}
```

---

## Anti-Hallucination Strategy
- Prompts include system instructions explicitly instructing the model to declare when information cannot be found in retrieved course material rather than fabricating nonexistent modules or lessons.
