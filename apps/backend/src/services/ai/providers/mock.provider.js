const BaseAIProvider = require('./base.provider');

/**
 * Deterministic Mock AI Provider for testing, local offline development,
 * and environments without external API keys.
 */
class MockAIProvider extends BaseAIProvider {
  constructor() {
    super('mock');
  }

  /**
   * Generates a context-aware pedagogical response based on user question and prompt
   */
  async generateResponse({ systemPrompt = '', messages = [] }) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const lower = lastMsg.toLowerCase();

    let reply = '';

    // 1. Check if user is asking for direct solution on a coding problem
    if (lower.includes('solution') || lower.includes('answer') || lower.includes('give me the code') || lower.includes('solve this for me')) {
      if (systemPrompt.includes('DIRECT')) {
        reply = `### Direct Solution Breakdown\n\nHere is the direct approach and solution for your problem:\n\n\`\`\`javascript\nfunction solve(input) {\n  // Optimal solution\n  return input;\n}\n\`\`\`\n\n**Complexity:** Time: O(n), Space: O(1).\nMake sure to test edge cases!`;
      } else {
        reply = `### Let's Work Through This Together!\n\nAs your AI Tutor, I won't just hand over the complete solution—that would rob you of the "aha!" moment. Instead, let's break down the logic step by step.\n\n1. **Core Concept:** What data structure or pattern best fits this problem?\n2. **Mental Check:** What are your base cases or boundary conditions?\n3. **Guiding Question:** If you had an input with only 1 element, what should happen?\n\n*Try writing out the pseudocode first, or ask for a **Hint** if you are stuck!*`;
      }
    }
    // 2. Progressive Hint Request
    else if (lower.includes('hint 1') || lower.includes('conceptual hint') || systemPrompt.includes('Tier 1')) {
      reply = `💡 **Hint 1: Conceptual Understanding**\n\nThink about what the problem is really asking you to compute. Can you visualize the inputs and the desired transformation without worrying about JavaScript syntax yet? What relationship exists between the input elements?`;
    } else if (lower.includes('hint 2') || lower.includes('approach hint') || systemPrompt.includes('Tier 2')) {
      reply = `💡 **Hint 2: Algorithmic Approach**\n\nConsider an iterative approach: traverse the array or string once using pointers or an accumulator. Can you keep track of the current maximum or frequency in an auxiliary variable as you scan?`;
    } else if (lower.includes('hint 3') || lower.includes('pseudocode hint') || systemPrompt.includes('Tier 3')) {
      reply = `💡 **Hint 3: Pseudocode Outline**\n\n\`\`\`text\n1. Initialize result = default_value\n2. For each element item in collection:\n     If condition(item) is met:\n        update result\n3. Return result\n\`\`\`\nTry translating this structure into your language!`;
    } else if (lower.includes('hint 4') || lower.includes('direct hint') || systemPrompt.includes('Tier 4')) {
      reply = `💡 **Hint 4: Direct Guidance**\n\nLook closely at how your return statement is handled inside the loop versus after the loop terminates. Also verify that you handle negative numbers or empty inputs appropriately.`;
    }
    // 3. Code Review
    else if (systemPrompt.includes('Code Review') || lower.includes('review my code') || lower.includes('code review')) {
      reply = `### AI Code Review Report\n\n#### 1. Summary\nYour solution demonstrates a solid grasp of the core logic and algorithmic requirements.\n\n#### 2. Highlights & Good Practices (Good)\n- Clean variable naming and legible control flow.\n- Correct algorithmic termination conditions.\n\n#### 3. Suggestions for Optimization (Consider)\n- Consider reducing auxiliary array allocations if memory limits are strict.\n- Early return on null or empty input checks.\n\n#### 4. Potential Edge Cases (Potential Issue)\n- Ensure you handle negative inputs or zero gracefully.\n- Boundary check for empty collections.\n\n#### 5. Complexity Analysis\n- **Time Complexity:** O(n)\n- **Space Complexity:** O(1) auxiliary space.`;
    }
    // 4. Error Diagnosis
    else if (systemPrompt.includes('Error Diagnostic') || lower.includes('explain error') || lower.includes('error')) {
      reply = `### Diagnostic Error Breakdown\n\n- **What happened:** The runtime encountered an unexpected condition or type mismatch.\n- **Why it occurred:** An operation was performed on a value that evaluated to \`undefined\` or exceeded bounds.\n- **Where to look:** Check your variable initialization right before the loop and your array indexing.\n- **How to debug:** Add a console log to print the current variable state, and ensure base boundary checks exist before accessing properties.`;
    }
    // 5. Lesson Summary
    else if (systemPrompt.includes('Lesson Summarizer') || lower.includes('summarize')) {
      reply = `### Lesson Summary & Key Takeaways\n\n1. **Core Concept:** Understanding the underlying mental model and why this topic exists in modern software development.\n2. **Key Definitions:** Important terminology, invariants, and scope.\n3. **Practical Examples:** Standard usage patterns in production code.\n4. **Common Pitfalls:** Forgetting asynchronous handling, state mutation bugs, or off-by-one errors.\n5. **Interview Focus:** Be prepared to explain trade-offs and time complexity when discussing this topic in technical interviews.`;
    }
    // 6. Study Plan
    else if (systemPrompt.includes('Study Plan') || lower.includes('study plan')) {
      reply = `### Personalized Learning Plan\n\nBased on your active course progress and solved problems:\n\n- **Phase 1 (Days 1-2):** Fundamentals & Core Syntax Practice (review lessons on functions and closures).\n- **Phase 2 (Days 3-4):** Data Structures & Algorithms (tackle Easy & Medium practice problems).\n- **Phase 3 (Days 5-6):** System Design & Real-world Exercises (complete module assessment).\n- **Phase 4 (Day 7):** Capstone Project & Mock Technical Interview.`;
    }
    // 7. General Pedagogical Answer
    else {
      reply = `Hello! I am your AI Learning Assistant.\n\nRegarding your question: **"${lastMsg}"**\n\nIn modern software engineering, mastering this concept requires understanding the problem it solves. Break the challenge into smaller sub-problems, verify each step with test cases, and observe how data flows through the program.\n\nWould you like me to:\n1. Provide a step-by-step conceptual explanation?\n2. Show a concrete example?\n3. Quiz you with a quick practice question to test your understanding?`;
    }

    const words = reply.split(/\s+/).length;
    return {
      content: reply,
      tokenUsage: {
        promptTokens: Math.max(10, Math.round(lastMsg.length / 4)),
        completionTokens: Math.max(20, words),
        totalTokens: Math.max(30, Math.round(lastMsg.length / 4) + words),
      },
    };
  }

  async *generateStream(params) {
    const res = await this.generateResponse(params);
    const tokens = res.content.split(' ');
    for (let i = 0; i < tokens.length; i++) {
      yield { token: (i === 0 ? '' : ' ') + tokens[i], done: false };
      // Slight async tick
      await new Promise((r) => setTimeout(r, 10));
    }
    yield { token: '', done: true };
  }
}

module.exports = MockAIProvider;
