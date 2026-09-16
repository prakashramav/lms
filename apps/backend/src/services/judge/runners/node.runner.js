const { BaseRunner } = require('./base.runner');
const { Sandbox } = require('../sandbox');
const { areOutputsEqual } = require('../normalizer');

class NodeRunner extends BaseRunner {
  constructor() {
    super('node');
  }

  async executeTestCase(studentCode, problem, testCase) {
    const sandbox = new Sandbox({ timeout: 2500 });
    const funcName = problem.functionSignature?.name;

    let harnessCode = '';

    if (funcName) {
      harnessCode = `
${studentCode}

(function __run_node_test__() {
  if (typeof ${funcName} !== 'function') {
    throw new Error('Function "${funcName}" is not defined.');
  }
  const __input_args__ = [${testCase.input}];
  const res = ${funcName}(...__input_args__);
  return res;
})();
`;
    } else {
      // Mock readline / input stream
      harnessCode = `
const readline = {
  createInterface: () => ({
    on: (evt, cb) => {
      if (evt === 'line') {
        const lines = ${JSON.stringify(testCase.input)}.split('\\n');
        lines.forEach(l => cb(l));
      }
      if (evt === 'close') cb();
    }
  })
};

${studentCode}
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

    let actualOutputStr = '';
    if (funcName && execResult.result !== undefined) {
      actualOutputStr =
        typeof execResult.result === 'object'
          ? JSON.stringify(execResult.result)
          : String(execResult.result);
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

module.exports = { NodeRunner };
