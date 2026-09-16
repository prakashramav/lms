const { parse } = require('node-html-parser');
const { BaseRunner } = require('./base.runner');
const { areOutputsEqual } = require('../normalizer');

class HtmlCssRunner extends BaseRunner {
  constructor() {
    super('html_css');
  }

  async executeTestCase(studentCode, problem, testCase) {
    const startTime = process.hrtime.bigint();

    try {
      // Parse HTML structure
      const document = parse(studentCode);

      // testCase.input defines the assertion to run, for example:
      // JSON format: { "selector": ".card", "property": "exists" }
      let actualOutput = '';
      let testAssertion = null;

      try {
        testAssertion = JSON.parse(testCase.input);
      } catch {
        testAssertion = { selector: testCase.input, property: 'exists' };
      }

      if (testAssertion.selector) {
        const el = document.querySelector(testAssertion.selector);
        if (!el) {
          actualOutput = 'null';
        } else if (testAssertion.property === 'exists') {
          actualOutput = 'true';
        } else if (testAssertion.property === 'textContent') {
          actualOutput = (el.text || el.textContent || '').trim();
        } else if (testAssertion.property === 'innerHTML') {
          actualOutput = (el.innerHTML || '').trim();
        } else if (testAssertion.property === 'className') {
          actualOutput = (el.getAttribute('class') || '').trim();
        } else if (testAssertion.property === 'tagName') {
          actualOutput = (el.tagName || '').toLowerCase();
        } else if (testAssertion.property === 'attribute' && testAssertion.attributeName) {
          actualOutput = el.getAttribute(testAssertion.attributeName) || '';
        } else if (testAssertion.property === 'count') {
          const els = document.querySelectorAll(testAssertion.selector);
          actualOutput = String(els.length);
        } else {
          actualOutput = (el.text || el.textContent || '').trim();
        }
      }

      const passed = areOutputsEqual(actualOutput, testCase.expectedOutput);
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e6;

      return {
        passed,
        actualOutput,
        expectedOutput: testCase.expectedOutput,
        executionTime: Math.round(executionTime * 100) / 100,
        memoryUsed: 0,
        verdict: passed ? 'ACCEPTED' : 'WRONG_ANSWER',
        errorMessage: passed ? null : `Element or property mismatch for ${testAssertion.selector || 'DOM'}`,
        stdout: `Evaluated DOM selector: ${testAssertion.selector || 'element'}\n`,
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e6;

      return {
        passed: false,
        actualOutput: err.message,
        expectedOutput: testCase.expectedOutput,
        executionTime: Math.round(executionTime * 100) / 100,
        memoryUsed: 0,
        verdict: 'RUNTIME_ERROR',
        errorMessage: `DOM Parsing Error: ${err.message}`,
        stdout: '',
      };
    }
  }
}

module.exports = { HtmlCssRunner };
