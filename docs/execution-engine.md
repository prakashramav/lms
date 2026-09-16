# Online Judge Execution Engine

## Overview
The execution engine is responsible for evaluating untrusted code submissions within isolated sandbox boundaries, gathering execution telemetry, and calculating pass/fail verdicts.

## Job Pipeline

1. **Submission / Run Request**:
   - The student dispatches `POST /api/v1/practice/problems/:problemId/run` or `POST /api/v1/practice/problems/:problemId/submit`.
   - Rate limiting validates user quotas (max 30 runs/min, 15 submissions/min).
   - Code size is strictly validated (capped at 100 KB).

2. **Job Enqueueing**:
   - The API layer loads problem metadata and test cases (public tests for `run`, public + hidden tests for `submit`).
   - The job is enqueued into `ExecutionQueue` with status `QUEUED`.

3. **Worker Processing**:
   - `ExecutionWorker` dequeues the execution job.
   - Selects the registered language runner (`JavaScriptRunner`, `HtmlCssRunner`, `ReactRunner`, `NodeRunner`, `ExpressRunner`).
   - Test cases are executed sequentially.
   - If a test encounters a `COMPILE_ERROR`, execution stops immediately.
   - If an execution exceeds 2500ms, the watchdog terminates the runner and awards `TIME_LIMIT_EXCEEDED`.

4. **Verdict Determination**:
   - **`ACCEPTED`**: 100% of test cases matched the expected output.
   - **`WRONG_ANSWER`**: Program executed cleanly, but one or more outputs differed.
   - **`TIME_LIMIT_EXCEEDED`**: Script execution or infinite loop exceeded 2.5 seconds.
   - **`COMPILE_ERROR`**: JavaScript syntax error during initial compilation.
   - **`RUNTIME_ERROR`**: Uncaught exception during code execution.
   - **`SYSTEM_ERROR`**: Execution service failure or unsupported language.

5. **Sanitization & Masking**:
   - For all test cases where `isHidden: true`:
     - `input` is stripped (`undefined`).
     - `expectedOutput` is stripped (`undefined`).
     - `actualOutput` returns `"Hidden test output differs"` if failed.
     - Student clients receive zero answer keys or private test data.
