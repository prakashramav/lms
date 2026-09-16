# Test Case Engine & Output Normalization

## Test Case Architecture
Test cases are stored in a dedicated MongoDB collection (`TestCase`) linked to parent problems via `problemId`.

### Public vs. Hidden Test Cases
- **Public Test Cases (`isHidden: false`)**:
  - Returned to the client on `GET /api/v1/practice/problems/:slug`.
  - Displayed in the IDE test panel.
  - Executed on `POST /run`.
- **Hidden Test Cases (`isHidden: true`)**:
  - Filtered out from public problem endpoints.
  - Executed only on `POST /submit`.
  - When returning submission reports, `input` and `expectedOutput` are stripped from responses to prevent leaking answer keys.

## Output Normalization Rules (`normalizer.js`)
To ensure fair grading across operating systems without hiding genuine algorithmic errors, comparison applies the following rules:
1. **Newline Normalization**: Converts all Windows `\r\n` and old Mac `\r` to standard POSIX `\n`.
2. **Line-End Whitespace**: Strips trailing spaces from each individual output line (`trimEnd()`).
3. **Leading/Trailing Blank Lines**: Trims empty lines at the start and end of the output.
4. **JSON Equivalence**: If both actual and expected outputs parse as valid JSON objects or arrays, deep structural comparison is applied (order of object keys does not cause false negatives).
5. **Numeric Precision**: If both outputs are numbers, floating-point comparison with epsilon `1e-6` is applied.
