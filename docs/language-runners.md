# Language Runners & Adapter Specifications

## Overview
The execution system uses an extensible adapter pattern (`BaseRunner`) allowing language-specific preparation, harness construction, and evaluation without bloating API controllers.

## Implemented Language Runners

### 1. `JavaScriptRunner` (`javascript`)
- **Execution Target**: Modern ECMAScript (ES2024+)
- **Function Mode**: Wraps student function definitions (e.g. `twoSum(nums, target)`) and calls them with parsed test inputs.
- **Script Mode**: Executes top-level statements and captures stdout output.

### 2. `HtmlCssRunner` (`html_css`)
- **Execution Target**: HTML5 markup and embedded CSS styles
- **Assertion Strategy**: Uses `node-html-parser` to construct a document tree and query elements by CSS selector, validating `textContent`, `innerHTML`, `className`, element counts, or attributes against test criteria.

### 3. `ReactRunner` (`react`)
- **Execution Target**: React 18 functional components with hooks (`useState`, `useEffect`)
- **Assertion Strategy**: Injects a lightweight virtual DOM simulator into the VM, renders components with test props, and asserts DOM query results.

### 4. `NodeRunner` (`node`)
- **Execution Target**: Node.js script execution
- **Assertion Strategy**: Simulates standard input streams via mock `readline` and captures formatted console output.

### 5. `ExpressRunner` (`express`)
- **Execution Target**: Express.js route handlers and middlewares
- **Assertion Strategy**: Instantiates an in-memory virtual Express application, dispatches synthetic HTTP requests (`GET`, `POST`, `PUT`, `DELETE`), and evaluates status codes and JSON response bodies without opening TCP ports.

## Future Language Roadmap
- `PythonRunner` (`python`): Isolated Docker / WASM container runner.
- `JavaRunner` (`java`): JVM sandboxed execution.
- `CppRunner` (`cpp`): GCC compiled sandbox runner.
- `TypeScriptRunner` (`typescript`): Transpiled TS-to-JS runner.
