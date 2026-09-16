/**
 * Prompt builder for structured AI Code Review
 */
function buildCodeReviewPrompt({ problem, code, language, executionResult }) {
  return `You are performing an AI Code Review for a student's solution.

PROBLEM:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description: ${problem.description}

STUDENT SUBMISSION:
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

EXECUTION TELEMETRY:
Verdict: ${executionResult?.verdict || 'PENDING'}
Execution Time: ${executionResult?.executionTime || 0}ms
Memory: ${executionResult?.memory || 0}MB

REVIEW RUBRIC:
Provide a structured code review using the following standard headings:
### Summary
Brief objective assessment of the approach.

### Highlights (Good)
Strengths in logic, naming, or algorithmic choice.

### Considerations (Consider)
Opportunities for optimization, clean code, or idiomatic patterns.

### Potential Issues (Potential Issue)
Boundary cases, null checks, or memory overhead concerns.

### Practices to Avoid (Avoid)
Anti-patterns, deeply nested loops, or magic constants.

### Complexity Analysis
- **Time Complexity:** O(...) with explanation
- **Space Complexity:** O(...) with explanation

### Suggested Improvements
Concrete recommendation or slight refactoring illustration.`;
}

module.exports = {
  buildCodeReviewPrompt,
};
