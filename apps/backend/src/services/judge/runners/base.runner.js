/**
 * Base Language Runner Interface
 */
class BaseRunner {
  constructor(languageId) {
    this.languageId = languageId;
  }

  /**
   * Prepares execution code harness
   * @param {string} studentCode
   * @param {object} problem
   * @param {object} testCase
   * @returns {string} Executable wrapped code
   */
  prepare(studentCode, problem, testCase) {
    throw new Error('prepare() must be implemented by runner');
  }

  /**
   * Executes code against a test case
   * @param {string} studentCode
   * @param {object} problem
   * @param {object} testCase
   * @returns {Promise<object>} Test result
   */
  async executeTestCase(studentCode, problem, testCase) {
    throw new Error('executeTestCase() must be implemented by runner');
  }
}

module.exports = { BaseRunner };
