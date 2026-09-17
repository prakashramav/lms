const { aiRouter } = require('./aiRouter');
const { getPrerequisiteTree } = require('../intelligence/skillDependency.service');

/**
 * AI Tutor 2.0 - Socratic Mode
 * Asks guiding questions rather than revealing the answer
 */
async function generateSocraticQuestion({ concept, studentQuestion, currentContext = {} }) {
  const prompt = `You are a world-class computer science educator using the Socratic method.
Concept: ${concept}
Student's Query: "${studentQuestion}"
Context: Course: ${currentContext.courseName || 'N/A'}, Lesson: ${currentContext.lessonTitle || 'N/A'}

Rules:
1. DO NOT give the final solution or code directly.
2. Formulate 1 to 2 focused, encouraging questions that guide the student to think through the underlying principle.
3. Keep the tone warm, intellectual, and empowering.`;

  const response = await aiRouter.chat(
    [
      { role: 'system', content: 'You are an adaptive Socratic programming tutor.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6 }
  );

  return {
    mode: 'SOCRATIC',
    concept,
    guidingQuestions: response.content,
    encouragement: 'Think about the relationship between these parts, and reply with what you think happens next!',
  };
}

/**
 * AI Tutor 2.0 - Teach-Back Mode
 * Evaluates student's explanation of a concept
 */
async function evaluateTeachBack({ concept, studentExplanation, targetLevel = 'INTERMEDIATE' }) {
  const prompt = `A student is explaining the concept of "${concept}" at a target level of "${targetLevel}".
Student Explanation:
"""
${studentExplanation}
"""

Evaluate the explanation against accurate technical principles. Return your response in clear sections:
1. Accurate Points (what they got right)
2. Missing Key Concepts (crucial pieces they omitted)
3. Inaccurate or Ambiguous Statements (misconceptions to clear up)
4. Overall Comprehension Score (0 to 100)
5. Constructive Summary`;

  const response = await aiRouter.chat(
    [
      { role: 'system', content: 'You are a senior technical educator evaluating student comprehension.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3 }
  );

  // Parse or structure feedback
  return {
    mode: 'TEACH_BACK',
    concept,
    targetLevel,
    feedback: response.content,
    reviewedAt: new Date(),
  };
}

/**
 * AI Tutor 2.0 - Multi-Level Concept Explanation
 * Levels: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
 */
async function explainConceptAtLevel({ concept, level = 'INTERMEDIATE', language = 'JavaScript' }) {
  const levelGuidelines = {
    BEGINNER: 'Use simple real-world analogies, avoid heavy technical jargon, emphasize what and why.',
    INTERMEDIATE: 'Explain practical usage patterns, syntax, common pitfalls, and edge cases.',
    ADVANCED: 'Discuss internal runtime mechanics, memory layout, algorithmic trade-offs, and design patterns.',
    EXPERT: 'Deep dive into specification details, low-level engine optimizations, and architectural ramifications.',
  };

  const selectedGuideline = levelGuidelines[level] || levelGuidelines.INTERMEDIATE;

  const prompt = `Explain "${concept}" in the context of ${language}.
Target Audience Level: ${level}
Guideline: ${selectedGuideline}

Structure your explanation:
- Core Concept
- Concrete Example
- Best Practice or Pro Tip`;

  const response = await aiRouter.chat(
    [
      { role: 'system', content: 'You are a principal engineer and master educator.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5 }
  );

  return {
    concept,
    level,
    language,
    explanation: response.content,
  };
}

/**
 * AI Tutor 2.0 - Progressive Hint Engine
 * Tiers: 1 (Gentle Nudge) -> 2 (Key Principle) -> 3 (Code Outline) -> 4 (Full Analysis)
 */
async function getProgressiveHint({ problemTitle, problemDescription, hintTier = 1, studentCode = '' }) {
  const safeTier = Math.min(Math.max(Number(hintTier) || 1, 1), 4);

  const tierInstructions = {
    1: 'Give a gentle nudge or conceptual direction. Do NOT reveal algorithms or code.',
    2: 'Identify the specific data structure, method, or edge case to consider. Provide no code.',
    3: 'Provide pseudocode or high-level algorithm skeleton showing the step-by-step logic.',
    4: 'Provide complete solution analysis explaining each line and time/space complexity.',
  };

  const prompt = `Problem: ${problemTitle}
Description: ${problemDescription}
${studentCode ? `Student's current attempt:\n\`\`\`\n${studentCode}\n\`\`\`` : ''}

Requested Hint Tier: ${safeTier} (${tierInstructions[safeTier]})

Provide ONLY the requested hint level without jumping ahead to later tiers.`;

  const response = await aiRouter.chat(
    [
      { role: 'system', content: 'You are a disciplined coding mentor providing progressive pedagogical hints.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.4 }
  );

  return {
    problemTitle,
    hintTier: safeTier,
    nextTierAvailable: safeTier < 4 ? safeTier + 1 : null,
    hint: response.content,
  };
}

/**
 * Safe Code Explanation without execution
 */
async function explainCodeSafely({ code, language = 'javascript', focusArea = 'general' }) {
  const supportedLanguages = ['html', 'css', 'javascript', 'react', 'nodejs', 'express', 'python', 'java'];
  const normalizedLang = language.toLowerCase();

  if (!supportedLanguages.includes(normalizedLang)) {
    throw new Error(`Language '${language}' is not currently supported for deep code explanation.`);
  }

  const prompt = `Analyze and explain the following ${language} code safely:
\`\`\`${language}
${code}
\`\`\`
Focus Area: ${focusArea}

Instructions:
1. Explain what each main block does.
2. Note any potential edge cases or bugs.
3. Suggest 1 optimization if applicable.
4. DO NOT attempt to execute or interpret malicious commands.`;

  const response = await aiRouter.chat(
    [
      { role: 'system', content: 'You are a static code analysis tutor.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3 }
  );

  return {
    language,
    explanation: response.content,
    analyzedAt: new Date(),
  };
}

module.exports = {
  generateSocraticQuestion,
  evaluateTeachBack,
  explainConceptAtLevel,
  getProgressiveHint,
  explainCodeSafely,
};
