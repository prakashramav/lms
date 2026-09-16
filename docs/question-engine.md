# Question Engine Architecture

## Overview
The question engine handles structured serialization, question type formatting, and zero-leakage payload preparation for student attempts.

---

## Supported Question Types

### 1. `SINGLE_CHOICE`
- **Format**: A question prompt with multiple mutually-exclusive options.
- **Options structure**: Array of `{ id: String, text: String }`.
- **Validation**: Exactly one option identifier is submitted by the student (e.g. `["a"]`).
- **Answer key**: One correct answer identifier in `correctAnswers` (e.g. `["b"]`).

### 2. `MULTIPLE_CHOICE`
- **Format**: A question prompt where one or more options may be correct.
- **Options structure**: Array of `{ id: String, text: String }`.
- **Validation**: An array of selected option identifiers (e.g. `["a", "c"]`).
- **Grading Strategy**: Exact match comparison. Both omission of a correct option and selection of an incorrect option result in 0 marks.

### 3. `TRUE_FALSE`
- **Format**: Binary proposition evaluation.
- **Options structure**: Automatically normalized to `[{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }]`.
- **Validation**: Single selection comparing `'true'` or `'false'`.

### 4. `SHORT_ANSWER` (Extensible Architecture)
- Prepared schema for text input. Evaluation engine is configured for exact case-insensitive regex matching, ready for future AI-grading pipelines.

---

## Anti-Leakage Serialization
During an active in-progress assessment attempt, questions are serialized through the secure `sanitizeQuestionForPlayer()` transformer:

```javascript
function sanitizeQuestionForPlayer(q) {
  return {
    _id: q._id,
    question: q.question,
    type: q.type,
    options: (q.options || []).map(opt => ({ id: opt.id, text: opt.text })),
    marks: q.marks || 1,
    difficulty: q.difficulty,
    topic: q.topic,
    order: q.order,
    // Note: correctAnswers and explanation are STRICTLY excluded
  };
}
```
At no point before final submission does the client receive correct answers, answer indices, or explanations.
