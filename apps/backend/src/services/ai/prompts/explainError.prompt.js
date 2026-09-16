/**
 * Prompt builder for explaining compilation or runtime errors
 */
function buildExplainErrorPrompt({ problem, code, language, error, stderr }) {
  return `You are explaining a programming error to a student.

PROBLEM:
Title: ${problem?.title || 'Coding Practice'}
Language: ${language}

STUDENT CODE:
\`\`\`${language}
${code}
\`\`\`

ERROR TELEMETRY:
Error: ${error || 'Runtime / Execution Error'}
Stderr Output:
${stderr || 'No stderr logged'}

INSTRUCTIONS:
Explain the error clearly and constructively using the following markdown format:
### What Happened
Simple plain-English description of the error.

### Why It Happened
The exact programming mechanism or condition that triggered it.

### Where to Look
The line of code or logic block responsible.

### How to Debug
Concrete steps or debugging prints to observe the issue.

### Possible Correction
Conceptual guidance on fixing it (do NOT write the complete solution).`;
}

module.exports = {
  buildExplainErrorPrompt,
};
