/**
 * Prompt builder for lesson summarization
 */
function buildSummarizePrompt({ lesson, course }) {
  return `You are summarizing an educational course lesson for a student.

COURSE: ${course?.title || 'Course Curriculum'}
LESSON TITLE: ${lesson?.title || 'Lesson Overview'}
LESSON TYPE: ${lesson?.type || 'VIDEO/ARTICLE'}

CONTENT:
${lesson?.content || lesson?.description || 'Curriculum technical topic.'}

INSTRUCTIONS:
Generate a structured technical summary with the following sections:
### 1. Main Concepts
High-level conceptual overview.

### 2. Important Definitions
Key terms, syntax constructs, and concepts introduced.

### 3. Practical Code Examples
Concise code snippet demonstrating best practice usage.

### 4. Common Mistakes & Pitfalls
Gotchas that beginners and engineers commonly make.

### 5. Key Takeaways
Bullet points summarizing essential learnings.

### 6. Potential Interview Questions
2-3 realistic technical interview questions related to this topic.`;
}

module.exports = {
  buildSummarizePrompt,
};
