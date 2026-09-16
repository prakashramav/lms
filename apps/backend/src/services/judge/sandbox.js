const vm = require('node:vm');

const MAX_OUTPUT_LENGTH = 10 * 1024; // 10 KB maximum output buffer
const DEFAULT_TIMEOUT_MS = 2500; // 2.5 seconds timeout limit

/**
 * Isolated VM Sandbox
 * Executes untrusted JavaScript within a hardened, null-prototype context
 * with zero access to filesystem, network, child processes, or host environment.
 */
class Sandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || DEFAULT_TIMEOUT_MS;
    this.maxOutput = options.maxOutput || MAX_OUTPUT_LENGTH;
  }

  /**
   * Run code in an isolated sandbox context
   * @param {string} code - The code string to execute
   * @param {object} customContext - Additional safe variables/harness to expose
   * @returns {Promise<object>} - Execution result including stdout, stderr, executionTime, verdict
   */
  async run(code, customContext = {}) {
    const stdoutParts = [];
    const stderrParts = [];
    let stdoutLength = 0;
    let stderrLength = 0;

    const safeConsole = {
      log: (...args) => {
        if (stdoutLength < this.maxOutput) {
          const line = args.map(this._formatArg).join(' ') + '\n';
          stdoutParts.push(line);
          stdoutLength += line.length;
        }
      },
      info: (...args) => {
        if (stdoutLength < this.maxOutput) {
          const line = args.map(this._formatArg).join(' ') + '\n';
          stdoutParts.push(line);
          stdoutLength += line.length;
        }
      },
      warn: (...args) => {
        if (stderrLength < this.maxOutput) {
          const line = args.map(this._formatArg).join(' ') + '\n';
          stderrParts.push(line);
          stderrLength += line.length;
        }
      },
      error: (...args) => {
        if (stderrLength < this.maxOutput) {
          const line = args.map(this._formatArg).join(' ') + '\n';
          stderrParts.push(line);
          stderrLength += line.length;
        }
      },
    };

    // Safe base context: provide only safe console and null-out hazardous host bindings
    const sandboxContext = {
      console: safeConsole,
      process: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      global: undefined,
      globalThis: undefined,
      Buffer: undefined,
      fetch: undefined,
      XMLHttpRequest: undefined,
      WebSocket: undefined,
      setTimeout: undefined,
      setInterval: undefined,
      setImmediate: undefined,
    };

    // Merge custom safe context items (e.g. test harness functions)
    for (const [key, val] of Object.entries(customContext)) {
      sandboxContext[key] = val;
    }

    const context = vm.createContext(sandboxContext);

    const startTime = process.hrtime.bigint();
    let result = undefined;
    let verdict = 'ACCEPTED';
    let errorMessage = null;

    try {
      const script = new vm.Script(code, {
        filename: 'student_submission.js',
        displayErrors: true,
      });

      result = script.runInContext(context, {
        timeout: this.timeout,
        displayErrors: true,
        breakOnSigint: true,
      });

      // If the code returned a Promise, wait for resolution (with timeout safeguard)
      if (result && typeof result.then === 'function') {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            const err = new Error('Async execution timed out');
            err.code = 'ERR_SCRIPT_EXECUTION_TIMEOUT';
            reject(err);
          }, this.timeout)
        );
        result = await Promise.race([result, timeoutPromise]);
      }
    } catch (err) {
      if (
        err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ||
        err.message?.includes('timed out') ||
        err.message?.includes('execution timed out')
      ) {
        verdict = 'TIME_LIMIT_EXCEEDED';
        errorMessage = 'Execution exceeded the time limit (2.5s).';
      } else if (err.name === 'SyntaxError') {
        verdict = 'COMPILE_ERROR';
        errorMessage = `Syntax Error: ${err.message}`;
      } else {
        verdict = 'RUNTIME_ERROR';
        errorMessage = `Runtime Error: ${err.message}`;
      }
      stderrParts.push(errorMessage + '\n');
    }

    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1e6; // milliseconds
    const memoryUsed = Math.round(process.memoryUsage().heapUsed / 1024); // KB approximation

    return {
      success: verdict === 'ACCEPTED',
      verdict,
      result,
      stdout: stdoutParts.join(''),
      stderr: stderrParts.join(''),
      executionTime: Math.round(executionTime * 100) / 100,
      memoryUsed,
      errorMessage,
    };
  }

  _formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Object]';
      }
    }
    return String(arg);
  }
}

module.exports = { Sandbox };
