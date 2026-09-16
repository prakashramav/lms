/**
 * Prompt builder for progressive coding hints
 */
function buildHintPrompt({ problem, tier = 1, currentCode, language }) {
  const tierDescriptions = {
    1: 'Tier 1 (Conceptual): Give a high-level conceptual hint. Focus on the core mental model or data structure needed without writing any implementation details.',
    2: 'Tier 2 (Approach): Outline the general algorithmic approach and control flow. Describe how to traverse or process the input step by step.',
    3: 'Tier 3 (Pseudocode): Provide a concise pseudocode template illustrating the structure, variable initialization, and loop termination.',
    4: 'Tier 4 (Direct Guidance): Provide specific hints targeting potential subtle bugs, edge cases, return types, or syntax nuances.',
  };

  return `You are generating a progressive hint for a coding problem.

PROBLEM:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description: ${problem.description}
Constraints: ${problem.constraints || 'Standard'}

REQUESTED HINT LEVEL:
${tierDescriptions[tier] || tierDescriptions[1]}

STUDENT CURRENT LANGUAGE: ${language || 'javascript'}
STUDENT CURRENT CODE:
\`\`\`${language || 'javascript'}
${currentCode || '// No code written yet'}
\`\`\`

INSTRUCTIONS:
- Format response with a title: "💡 Hint ${tier} of 4: [Title]"
- Do NOT reveal the complete solution code.
- Provide clear, encouraging guidance tailored specifically to Tier ${tier}.`;
}

module.exports = {
  buildHintPrompt,
};
