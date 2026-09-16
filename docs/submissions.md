# Submission Engine & Scoring Lifecycle

## Submission Lifecycle

```
Draft in IDE (autosaved to ProblemDraft)
  │
  ▼  (Student clicks "Submit")
POST /api/v1/practice/problems/:problemId/submit
  │
  ├─► Enqueue Job with all test cases (public + hidden)
  ├─► Worker evaluates code in isolated sandbox
  ├─► Calculate passed test count and verdict
  │
  ▼
Create Submission Record (status: 'COMPLETED')
  │
  ├─► Score: (passedTests / totalTests) * 100
  ├─► Update Problem totalSubmissions & acceptedSubmissions
  │
  ▼
Return Sanitized Submission Report
```

## Verdict Definitions
- `ACCEPTED`: Code passed 100% of all public and hidden test cases.
- `WRONG_ANSWER`: One or more test cases did not match the expected output.
- `TIME_LIMIT_EXCEEDED`: Execution exceeded 2.5 seconds (infinite loop or inefficient complexity).
- `COMPILE_ERROR`: Syntax error encountered during script parsing.
- `RUNTIME_ERROR`: Unhandled exception or TypeError during execution.
- `SYSTEM_ERROR`: Infrastructure error or unsupported language.

## IDOR Protection
Only the student who submitted the code can view their submission report via `GET /api/v1/practice/submissions/:submissionId`. Requests by other students are rejected with `403 Forbidden`.
