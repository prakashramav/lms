/**
 * Prompt builder for generating practice quiz questions
 */
function buildPracticeGenPrompt({ topic, difficulty = 'MEDIUM', count = 3 }) {
  return `You are generating ${count} practice quiz questions on "${topic}" at ${difficulty} difficulty level.

INSTRUCTIONS:
Return a JSON array of questions strictly formatted as:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this option is correct."
  }
]

Do not wrap in markdown or backticks if possible, return valid parseable JSON.`;
}

module.exports = {
  buildPracticeGenPrompt,
};
