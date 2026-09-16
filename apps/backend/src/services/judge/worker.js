const { getRunner } = require('./runners');
const { getLanguageConfig } = require('./languageConfig');

/**
 * Execution Worker
 * Coordinates test runner execution across test cases and calculates verdicts.
 */
class ExecutionWorker {
  /**
   * Executes code against a collection of test cases
   * @param {object} params
   * @param {string} params.language
   * @param {string} params.code
   * @param {object} params.problem
   * @param {Array<object>} params.testCases
   * @param {boolean} params.isSubmission - true if executing hidden tests for submission
   * @returns {Promise<object>}
   */
  async execute({ language, code, problem, testCases, isSubmission = false }) {
    const langConfig = getLanguageConfig(language);
    if (!langConfig || !langConfig.isAvailable) {
      return {
        success: false,
        verdict: 'SYSTEM_ERROR',
        errorMessage: `Language "${language}" is not currently available for execution.`,
        passedTests: 0,
        totalTests: testCases.length,
        executionTime: 0,
        memoryUsed: 0,
        testResults: [],
      };
    }

    const runner = getRunner(language);
    if (!runner) {
      return {
        success: false,
        verdict: 'SYSTEM_ERROR',
        errorMessage: `No execution runner found for language "${language}".`,
        passedTests: 0,
        totalTests: testCases.length,
        executionTime: 0,
        memoryUsed: 0,
        testResults: [],
      };
    }

    const testResults = [];
    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;
    let finalVerdict = 'ACCEPTED';
    let combinedStdout = '';
    let combinedStderr = '';

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await runner.executeTestCase(code, problem, tc);

      totalTime += result.executionTime || 0;
      if (result.memoryUsed > maxMemory) maxMemory = result.memoryUsed;

      if (result.stdout) combinedStdout += result.stdout;
      if (result.stderr) combinedStderr += result.stderr;

      if (result.passed) {
        passedCount++;
      } else {
        // Priority for non-accepted verdicts:
        // COMPILE_ERROR > TIME_LIMIT_EXCEEDED > RUNTIME_ERROR > WRONG_ANSWER
        if (finalVerdict === 'ACCEPTED' || finalVerdict === 'WRONG_ANSWER') {
          finalVerdict = result.verdict || 'WRONG_ANSWER';
        } else if (result.verdict === 'COMPILE_ERROR') {
          finalVerdict = 'COMPILE_ERROR';
        }
      }

      // Sanitize response: NEVER leak hidden test input or expected output
      const sanitizedTestCaseResult = {
        testCaseId: tc._id,
        order: tc.order ?? i + 1,
        passed: result.passed,
        isHidden: tc.isHidden || false,
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        actualOutput: tc.isHidden && !result.passed ? 'Hidden test output differs' : result.actualOutput,
        errorMessage: result.errorMessage,
        executionTime: result.executionTime,
      };

      testResults.push(sanitizedTestCaseResult);

      // Stop on fatal compile or system error
      if (result.verdict === 'COMPILE_ERROR') {
        break;
      }
    }

    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

    return {
      success: finalVerdict === 'ACCEPTED',
      verdict: finalVerdict,
      score,
      passedTests: passedCount,
      totalTests: testCases.length,
      executionTime: Math.round(totalTime * 100) / 100,
      memoryUsed: maxMemory,
      stdout: combinedStdout,
      stderr: combinedStderr,
      testResults,
    };
  }
}

const executionWorker = new ExecutionWorker();

module.exports = {
  ExecutionWorker,
  executionWorker,
};
