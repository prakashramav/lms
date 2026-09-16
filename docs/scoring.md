# Scoring & Grading Engine

## Overview
All scoring and percentage evaluations are performed server-side upon attempt submission. The system eliminates any client-side score tampering vulnerabilities.

---

## 1. Grading Strategies

### Single Choice & True/False
- Compares normalized, lowercase string values:
  `studentAnswers[0].trim().toLowerCase() === correctAnswers[0].trim().toLowerCase()`
- **Correct**: Full `question.marks` awarded.
- **Incorrect**: 0 marks awarded.

### Multiple Choice (Exact Match Strategy)
- The student's selection must contain all correct answers and zero incorrect options.
- The sorted lowercase array of student selections is matched directly against the sorted lowercase array of correct answers:
  ```javascript
  const sortedStudent = [...studentSelections].sort();
  const sortedCorrect = [...correctSelections].sort();
  const isCorrect =
    sortedStudent.length === sortedCorrect.length &&
    sortedStudent.every((val, idx) => val === sortedCorrect[idx]);
  ```

| Example Question Key | Student Answer | Evaluation | Marks Awarded |
|---|---|---|---|
| `["a", "c"]` | `["a", "c"]` | Match | Full Marks |
| `["a", "c"]` | `["a"]` | Incomplete selection | 0 Marks |
| `["a", "c"]` | `["a", "b", "c"]` | Extra incorrect option chosen | 0 Marks |
| `["a", "c"]` | `["b", "d"]` | Incorrect selection | 0 Marks |

---

## 2. Percentage & Passing Threshold
- **Total Marks Awarded**: Sum of `marksAwarded` across all questions.
- **Total Possible Marks**: Sum of `marks` for all active questions in the assessment.
- **Percentage**: `Math.round((totalMarksAwarded / totalPossibleMarks) * 100)`.
- **Pass / Fail Determination**: `percentage >= assessment.passingScore`.

---

## 3. Negative Marking Architecture
- The question and assessment schema include architecture for `negativeMarks` (default: 0).
- Negative marking is not applied unless explicitly configured on the assessment, preventing accidental penalty deductions.
