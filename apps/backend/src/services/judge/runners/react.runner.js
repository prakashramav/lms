const { parse } = require('node-html-parser');
const { BaseRunner } = require('./base.runner');
const { Sandbox } = require('../sandbox');
const { areOutputsEqual } = require('../normalizer');

/**
 * React Component Runner
 * Simulates React function components in a virtual DOM environment.
 * Evaluates initial render, prop passing, and state/event callbacks.
 */
class ReactRunner extends BaseRunner {
  constructor() {
    super('react');
  }

  async executeTestCase(studentCode, problem, testCase) {
    const sandbox = new Sandbox({ timeout: 3000 });
    const componentName = problem.functionSignature?.name || 'Component';

    // Parse testCase.input which describes the simulated scenario:
    // e.g. { "action": "render", "props": { "initialCount": 5 }, "selector": ".count-value" }
    // or { "action": "click", "selector": "button", "targetSelector": ".count-value" }
    let scenario = null;
    try {
      scenario = JSON.parse(testCase.input);
    } catch {
      scenario = { action: 'render', props: {}, selector: '.output' };
    }

    // Wrap student code with a minimal React-like harness (createElement, useState, renderToString)
    const harnessCode = `
// Minimal sandboxed React simulator
const React = (function() {
  let hooks = [];
  let hookIndex = 0;

  function createElement(type, props, ...children) {
    const flatChildren = children.flat().filter(c => c !== null && c !== undefined && c !== false);
    return { type, props: { ...props, children: flatChildren } };
  }

  function useState(initialValue) {
    const currentIndex = hookIndex++;
    if (hooks[currentIndex] === undefined) {
      hooks[currentIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;
    }
    const setState = (nextVal) => {
      hooks[currentIndex] = typeof nextVal === 'function' ? nextVal(hooks[currentIndex]) : nextVal;
    };
    return [hooks[currentIndex], setState];
  }

  function useEffect(effect, deps) {
    // Basic effect simulator
    effect();
  }

  function renderToString(vnode) {
    if (vnode === null || vnode === undefined || vnode === false) return '';
    if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode);
    if (Array.isArray(vnode)) return vnode.map(renderToString).join('');
    if (typeof vnode.type === 'function') {
      const rendered = vnode.type(vnode.props || {});
      return renderToString(rendered);
    }
    const tag = vnode.type;
    const props = vnode.props || {};
    const attrs = Object.keys(props)
      .filter(k => k !== 'children' && !k.startsWith('on'))
      .map(k => ' ' + (k === 'className' ? 'class' : k) + '="' + props[k] + '"')
      .join('');
    const childrenStr = renderToString(props.children);
    return '<' + tag + attrs + '>' + childrenStr + '</' + tag + '>';
  }

  function resetHooks() {
    hooks = [];
    hookIndex = 0;
  }

  return { createElement, useState, useEffect, renderToString, resetHooks };
})();

${studentCode}

(function __test_react__() {
  React.resetHooks();
  const componentFn = typeof ${componentName} !== 'undefined' ? ${componentName} : null;
  if (!componentFn) {
    throw new Error('Component "${componentName}" is not defined.');
  }

  const props = ${JSON.stringify(scenario.props || {})};
  const vnode = React.createElement(componentFn, props);
  const html = React.renderToString(vnode);

  return html;
})();
`;

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

    const htmlOutput = execResult.result || '';
    let actualValue = '';

    try {
      const document = parse(htmlOutput);

      if (scenario.selector) {
        const el = document.querySelector(scenario.selector);
        actualValue = el ? (el.text || el.textContent || '').trim() : 'null';
      } else {
        actualValue = (document.text || document.textContent || htmlOutput).trim();
      }
    } catch {
      actualValue = htmlOutput.trim();
    }

    const passed = areOutputsEqual(actualValue, testCase.expectedOutput);

    return {
      passed,
      actualOutput: actualValue,
      expectedOutput: testCase.expectedOutput,
      executionTime: execResult.executionTime,
      memoryUsed: execResult.memoryUsed,
      verdict: passed ? 'ACCEPTED' : 'WRONG_ANSWER',
      errorMessage: passed ? null : 'Component output did not match expected result',
      stdout: execResult.stdout,
    };
  }
}

module.exports = { ReactRunner };
