const { BaseRunner } = require('./base.runner');
const { Sandbox } = require('../sandbox');
const { areOutputsEqual } = require('../normalizer');

/**
 * Express Route & Middleware Runner
 * Simulates Express application routing and request dispatch without binding to physical network ports.
 */
class ExpressRunner extends BaseRunner {
  constructor() {
    super('express');
  }

  async executeTestCase(studentCode, problem, testCase) {
    const sandbox = new Sandbox({ timeout: 3000 });

    // testCase.input specifies the request scenario:
    // e.g. { "method": "GET", "url": "/api/users", "headers": {}, "body": {} }
    let reqScenario = null;
    try {
      reqScenario = JSON.parse(testCase.input);
    } catch {
      reqScenario = { method: 'GET', url: testCase.input };
    }

    const harnessCode = `
// Virtual Express mock harness (no physical sockets opened)
const express = (function() {
  function createApp() {
    const routes = [];
    const middlewares = [];

    const app = {
      use: (fn) => { middlewares.push(fn); },
      get: (path, handler) => { routes.push({ method: 'GET', path, handler }); },
      post: (path, handler) => { routes.push({ method: 'POST', path, handler }); },
      put: (path, handler) => { routes.push({ method: 'PUT', path, handler }); },
      delete: (path, handler) => { routes.push({ method: 'DELETE', path, handler }); },
      _routes: routes,
      _middlewares: middlewares,
    };

    app.json = () => (req, res, next) => { next(); };
    return app;
  }

  createApp.json = () => (req, res, next) => { next(); };
  return createApp;
})();

${studentCode}

(function __dispatch_express__() {
  const targetApp = typeof app !== 'undefined' ? app : null;
  if (!targetApp || !targetApp._routes) {
    throw new Error('Express app instance named "app" was not initialized or exported.');
  }

  const method = ${JSON.stringify((reqScenario.method || 'GET').toUpperCase())};
  const url = ${JSON.stringify(reqScenario.url || '/')};
  const body = ${JSON.stringify(reqScenario.body || {})};
  const headers = ${JSON.stringify(reqScenario.headers || {})};

  const matchedRoute = targetApp._routes.find(r => r.method === method && r.path === url);
  if (!matchedRoute) {
    return { statusCode: 404, body: { error: 'Not Found' } };
  }

  const req = {
    method,
    url,
    body,
    headers,
    params: {},
    query: {},
  };

  let responseStatusCode = 200;
  let responseBody = null;
  let responseHeaders = {};

  const res = {
    status: function(code) {
      responseStatusCode = code;
      return this;
    },
    json: function(data) {
      responseBody = data;
      return this;
    },
    send: function(data) {
      responseBody = data;
      return this;
    },
    setHeader: function(k, v) {
      responseHeaders[k] = v;
      return this;
    },
  };

  matchedRoute.handler(req, res);

  return {
    statusCode: responseStatusCode,
    body: responseBody,
  };
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

    const actualData = execResult.result || {};
    let actualOutputStr = '';

    // If expected output is a status code or JSON string
    if (typeof actualData.body === 'object') {
      actualOutputStr = JSON.stringify(actualData.body);
    } else if (actualData.body !== null && actualData.body !== undefined) {
      actualOutputStr = String(actualData.body);
    } else {
      actualOutputStr = String(actualData.statusCode);
    }

    const passed = areOutputsEqual(actualOutputStr, testCase.expectedOutput);

    return {
      passed,
      actualOutput: actualOutputStr,
      expectedOutput: testCase.expectedOutput,
      executionTime: execResult.executionTime,
      memoryUsed: execResult.memoryUsed,
      verdict: passed ? 'ACCEPTED' : 'WRONG_ANSWER',
      errorMessage: passed ? null : 'Route response did not match expected output',
      stdout: execResult.stdout,
    };
  }
}

module.exports = { ExpressRunner };
