const { getAIProvider } = require('../ai/providers');

/**
 * AI Assistant for instructor authoring tasks
 */
class InstructorAIService {
  constructor() {
    this.provider = getAIProvider();
  }

  /**
   * Generate structured lesson outline
   * @param {string} topic
   * @param {string} level
   * @param {string} courseContext
   */
  async generateLessonOutline(topic, level = 'Beginner', courseContext = '') {
    const prompt = `You are a curriculum architect creating a technical lesson outline.
Topic: ${topic}
Target Audience Level: ${level}
Course Context: ${courseContext || 'Modern Software Engineering'}

Generate a structured lesson outline in JSON format with:
- title: clear, engaging lesson title
- summary: 2-3 sentence overview
- learningObjectives: array of 4 measurable learning objectives (e.g. "Understand...", "Build...", "Debug...")
- sections: array of 4-5 section topics with bullet points of key concepts
- codeSnippetIdea: a practical code example to demonstrate the topic
- keyTakeaways: array of 3 summary takeaways

Respond ONLY with valid JSON conforming to this structure, no markdown backticks or commentary.`;

    try {
      const response = await this.provider.chat([
        { role: 'system', content: 'You are an educational curriculum AI that outputs only raw JSON.' },
        { role: 'user', content: prompt },
      ]);

      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Fallback structured template if AI provider is offline
      return {
        title: `Deep Dive into ${topic}`,
        summary: `A structured exploration of ${topic} designed for ${level} software engineers.`,
        learningObjectives: [
          `Understand the core principles and architecture of ${topic}`,
          `Implement idiomatic patterns and best practices`,
          `Identify and resolve common anti-patterns`,
          `Apply ${topic} in production environments`,
        ],
        sections: [
          { title: 'Foundational Concepts', concepts: ['Core terminology', 'Execution model', 'Why it matters'] },
          { title: 'Step-by-Step Implementation', concepts: ['Syntax overview', 'Primary APIs', 'Handling edge cases'] },
          { title: 'Practical Patterns', concepts: ['Modular design', 'State handling', 'Error boundaries'] },
          { title: 'Performance & Optimization', concepts: ['Memory footprint', 'Asynchronous flow', 'Profiling'] },
        ],
        codeSnippetIdea: `// Practical demonstration of ${topic}\nfunction demonstrate${topic.replace(/\s+/g, '')}() {\n  // Implementation here\n}`,
        keyTakeaways: [
          `${topic} provides fundamental structure for scalable applications.`,
          `Always handle asynchronous boundaries and edge cases gracefully.`,
          `Write modular, testable code adhering to industry standards.`,
        ],
      };
    }
  }

  /**
   * Generate draft multiple-choice questions for review
   * @param {string} topic
   * @param {string} difficulty
   * @param {number} count
   */
  async generateQuestions(topic, difficulty = 'Intermediate', count = 3) {
    const prompt = `Generate ${count} high-quality Multiple Choice Questions about "${topic}" at "${difficulty}" level for software engineers.
Each question must include:
- question: clear problem statement or code snippet question
- options: array of 4 options, each with id ("a", "b", "c", "d") and text
- correctAnswers: array containing single correct option id (e.g. ["b"])
- explanation: clear explanation of why this answer is correct and why others are incorrect
- topic: "${topic}"
- difficulty: "${difficulty}"
- marks: 1

Respond ONLY with a valid JSON array of question objects, no markdown backticks.`;

    try {
      const response = await this.provider.chat([
        { role: 'system', content: 'You are an assessment authoring AI that outputs only raw JSON arrays.' },
        { role: 'user', content: prompt },
      ]);

      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Fallback draft questions
      return [
        {
          question: `What is the primary architectural purpose of ${topic}?`,
          type: 'SINGLE_CHOICE',
          options: [
            { id: 'a', text: `To manage modularity and maintainable separation of concerns` },
            { id: 'b', text: `To bypass asynchronous event loops completely` },
            { id: 'c', text: `To disable strict runtime error handling` },
            { id: 'd', text: `To restrict memory usage to a single thread permanently` },
          ],
          correctAnswers: ['a'],
          explanation: `${topic} is designed to enforce modular separation of concerns and maintainability across scalable applications.`,
          difficulty,
          topic,
          marks: 1,
        },
      ];
    }
  }

  /**
   * Generate draft coding problem
   */
  async generateCodingProblem(topic, difficulty = 'EASY') {
    const prompt = `Generate a programming challenge about "${topic}" at "${difficulty}" level.
Include:
- title: concise problem title
- description: detailed problem statement explaining the input, objective, and behavior
- category: "JAVASCRIPT"
- difficulty: "${difficulty}"
- inputFormat: description of input arguments
- outputFormat: description of return value
- constraints: list of mathematical or length constraints
- examples: array of 2 examples with input, output, explanation
- starterCode: JavaScript starter function template
- sampleTestCases: array of 2 public test cases with input and expectedOutput
- hiddenTestCases: array of 2 hidden test cases with input and expectedOutput

Respond ONLY with valid JSON.`;

    try {
      const response = await this.provider.chat([
        { role: 'system', content: 'You are a technical challenge authoring AI that outputs only raw JSON.' },
        { role: 'user', content: prompt },
      ]);

      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        title: `Solve ${topic}`,
        description: `Implement an efficient algorithm to process elements according to ${topic} rules.`,
        category: 'JAVASCRIPT',
        difficulty,
        inputFormat: 'An array of numbers or strings `arr`',
        outputFormat: 'The processed result',
        constraints: '1 <= arr.length <= 10^5',
        examples: [
          { input: '[1, 2, 3]', output: '[2, 4, 6]', explanation: 'Each element doubled.' },
        ],
        starterCode: { javascript: 'function solve(arr) {\n  // Your implementation\n}\n' },
        sampleTestCases: [
          { input: '[1, 2, 3]', expectedOutput: '[2, 4, 6]', isHidden: false },
        ],
        hiddenTestCases: [
          { input: '[10, 20]', expectedOutput: '[20, 40]', isHidden: true },
        ],
      };
    }
  }
}

const instructorAIService = new InstructorAIService();

module.exports = instructorAIService;
