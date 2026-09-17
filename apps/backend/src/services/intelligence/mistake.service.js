const Mistake = require('../../models/mistake.model');

class MistakeService {
  /**
   * Retrieves paginated mistake book entries for a student
   */
  async getMistakes(studentId, { resolved = false, limit = 50 } = {}) {
    const query = { studentId };
    if (resolved !== undefined && resolved !== null) {
      query.resolved = resolved === 'true' || resolved === true;
    }

    return Mistake.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Retrieves single mistake detail
   */
  async getMistakeById(studentId, mistakeId) {
    const mistake = await Mistake.findOne({ _id: mistakeId, studentId });
    if (!mistake) {
      const err = new Error('MISTAKE_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }
    return mistake;
  }

  /**
   * Records a student mistake from assessment or coding execution
   */
  async recordMistake({
    studentId,
    sourceType,
    sourceId,
    topic,
    questionId = null,
    problemId = null,
    mistakeType = 'INCORRECT_CHOICE',
    promptSnippet = '',
    studentAnswer = null,
    correctAnswerReference = null,
    explanation = '',
  }) {
    // Avoid duplicate unresolved mistake entries for the exact same question/problem
    const existing = await Mistake.findOne({
      studentId,
      sourceId,
      ...(questionId && { questionId }),
      ...(problemId && { problemId }),
      resolved: false,
    });

    if (existing) {
      existing.retryCount += 1;
      existing.studentAnswer = studentAnswer;
      await existing.save();
      return existing;
    }

    return Mistake.create({
      studentId,
      sourceType,
      sourceId,
      topic,
      questionId,
      problemId,
      mistakeType,
      promptSnippet,
      studentAnswer,
      correctAnswerReference,
      explanation,
      resolved: false,
    });
  }

  /**
   * Handles a retry attempt for a mistake item
   */
  async retryMistake(studentId, mistakeId, { isCorrect = true } = {}) {
    const mistake = await Mistake.findOne({ _id: mistakeId, studentId });
    if (!mistake) {
      const err = new Error('MISTAKE_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    mistake.retryCount += 1;
    if (isCorrect) {
      mistake.resolved = true;
      mistake.resolvedAt = new Date();
    }

    await mistake.save();
    return mistake;
  }
}

module.exports = new MistakeService();
