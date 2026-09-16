# Assessment Security & Anti-Tampering

## Security Guarantees & Verification Checklist

### 1. Zero Answer-Key Leakage
- `correctAnswers` and `explanation` are completely omitted from all in-progress question endpoints (`POST /api/v1/assessments/:id/attempts` and `GET /api/v1/assessments/attempts/:id`).
- Explanations and answer keys are accessible only through `GET /api/v1/assessments/attempts/:id/review` after the attempt is marked `SUBMITTED`.

### 2. Server-Enforced Timer & Expiration
- Frontend countdown timers are purely visual aids.
- The server computes expiration strictly using:
  `elapsed = Date.now() - new Date(attempt.startedAt).getTime()`
- If `elapsed > durationMs + 30000` (allowing 30s latency grace), the server marks the attempt `EXPIRED` and rejects further answer modification.

### 3. IDOR Protection (Insecure Direct Object Reference)
- All attempt endpoints (`/attempts/:id`, `/attempts/:id/answers`, `/attempts/:id/submit`, `/attempts/:id/result`, `/attempts/:id/review`) verify:
  `attempt.studentId.toString() === req.user._id.toString()`
- Unauthorized students attempting to view or submit another student's attempt receive an immediate `403 Forbidden` response.

### 4. Idempotent Submission
- Calling the submit endpoint multiple times returns the pre-calculated score and attempt record without recalculating or generating duplicate entries.

### 5. Attempt Limits
- If `maxAttempts` is configured (e.g. `maxAttempts: 2`), starting a 3rd attempt is rejected server-side with a clear message: `"Maximum attempts reached for this assessment"`.
