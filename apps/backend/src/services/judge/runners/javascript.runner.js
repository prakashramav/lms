const { BaseRunner } = require('./base.runner');
const { Sandbox } = require('../sandbox');
const { areOutputsEqual } = require('../normalizer');

class JavaScriptRunner extends BaseRunner {
  constructor() {
    super('javascript');
  }

  async executeTestCase(studentCode, problem, testCase) {
    const sandbox = new Sandbox({ timeout: 2500 });
    const funcName = problem.functionSignature?.name;

    let harnessCode = studentCode + '\n\n';

    if (funcName) {
      // Function-based problem
      // Parse input arguments: testCase.input can be JSON array "[2, 7, 11, 15], 9" or a JSON string
      harnessCode += `
(function __run_test__() {
  if (typeof ${funcName} !== 'function') {
    throw new Error('Function "${funcName}" is not defined or exported as a function.');
  }
  const __input_args__ = [${testCase.input}];
  const __res__ = ${funcName}(...__input_args__);
  return __res__;
})();
`;
    } else {
      // Script / standard I/O based problem
      harnessCode += `
(function __run_test__() {
  const input = ${JSON.stringify(testCase.input)};
  return input;
})();
`;
    }

    const execResult = await sandbox.run(harnessCode);

    if (execResult.verdict !== 'ACCEPTED') {
      return {
        passed: false,
        actualOutput: execResult.stderr || execResult.errorMessage || 'Execution failed',
        expectedOutput: testCase.expectedOutput,
        executionTime: execResult.executionTime,
        memoryUsed: execResult.memoryUsed,
        verdict: execResult.verdict,
        errorMessage: execResult.errorMessage,
        stdout: execResult.stdout,
      };
    }

    // Format output
    let actualOutputStr = '';
    if (funcName) {
      actualOutputStr =
        execResult.result !== undefined
          ? typeof execResult.result === 'object'
            ? JSON.stringify(execResult.result)
            : String(execResult.result)
          : execResult.stdout.trim();
    } else {
      actualOutputStr = execResult.stdout.trim();
    }

    const passed = areOutputsEqual(actualOutputStr, testCase.expectedOutput);

    return {
      passed,
      actualOutput: actualOutputStr,
      expectedOutput: testCase.expectedOutput,
      executionTime: execResult.executionTime,
      memoryUsed: execResult.memoryUsed,
      verdict: passed ? 'ACCEPTED' : 'WRONG_ANSWER',
      errorMessage: passed ? null : 'Output did not match expected result',
      stdout: execResult.stdout,
    };
  }
}

module.exports = { JavaScriptRunner };
