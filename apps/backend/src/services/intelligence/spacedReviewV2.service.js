const SpacedReview = require('../../models/spacedReview.model');
const Mistake = require('../../models/mistake.model');
const { Skill } = require('../../models/skill.model');

const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

/**
 * Schedule or update a spaced review item using SM-2-inspired intervals
 */
async function scheduleSpacedReview({
  studentId,
  topic,
  resourceType = 'Topic',
  resourceId = null,
  performanceScore = 50,
  recallQuestion = '',
  recallAnswer = '',
  flashcardFront = '',
  flashcardBack = '',
  intervalSequence = DEFAULT_INTERVALS,
}) {
  let review = await SpacedReview.findOne({
    studentId,
    topic,
  });

  const nextIntervalDays = intervalSequence[0] || 1;
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

  if (!review) {
    review = new SpacedReview({
      studentId,
      topic,
      resourceType,
      resourceId,
      performanceScore,
      intervalDays: nextIntervalDays,
      intervalSequence,
      nextReview: nextReviewDate,
      recallQuestion,
      recallAnswer,
      flashcardFront,
      flashcardBack,
      status: 'DUE',
      reviewCount: 0,
      consecutiveSuccesses: 0,
    });
  } else {
    review.performanceScore = performanceScore;
    if (recallQuestion) review.recallQuestion = recallQuestion;
    if (recallAnswer) review.recallAnswer = recallAnswer;
    if (flashcardFront) review.flashcardFront = flashcardFront;
    if (flashcardBack) review.flashcardBack = flashcardBack;
    review.status = 'DUE';
  }

  await review.save();
  return review;
}

/**
 * Record a spaced review attempt and advance interval
 */
async function recordReviewAttempt(studentId, reviewId, { wasSuccessful, recallScore = 80 }) {
  const review = await SpacedReview.findOne({ _id: reviewId, studentId });
  if (!review) {
    throw new Error('Spaced review item not found');
  }

  const intervals = review.intervalSequence && review.intervalSequence.length > 0
    ? review.intervalSequence
    : DEFAULT_INTERVALS;

  review.reviewCount += 1;
  review.lastReviewed = new Date();
  review.performanceScore = recallScore;

  if (wasSuccessful) {
    review.consecutiveSuccesses += 1;
    // Advance to next interval
    const currentIndex = intervals.indexOf(review.intervalDays);
    if (currentIndex >= 0 && currentIndex < intervals.length - 1) {
      review.intervalDays = intervals[currentIndex + 1];
    } else {
      // Reached mastery threshold (e.g. 30 days completed)
      review.status = 'MASTERED';
      review.intervalDays = intervals[intervals.length - 1];
    }
  } else {
    // Reset to initial interval on failure
    review.consecutiveSuccesses = 0;
    review.intervalDays = intervals[0] || 1;
    review.status = 'DUE';
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + review.intervalDays);
  review.nextReview = nextReviewDate;

  await review.save();
  return review;
}

/**
 * Get items due for review
 */
async function getDueReviews(studentId, { includeUpcoming = false } = {}) {
  const now = new Date();
  const query = {
    studentId,
    status: { $in: ['DUE', 'REVIEWED'] },
  };

  if (!includeUpcoming) {
    query.nextReview = { $lte: now };
  }

  const dueItems = await SpacedReview.find(query)
    .sort({ nextReview: 1 })
    .lean();

  return {
    totalDue: dueItems.length,
    items: dueItems,
  };
}

/**
 * Log mistake into the Mistake Bank with category evidence and repetition analysis
 */
async function recordMistake({
  studentId,
  sourceType,
  sourceId,
  topic,
  skillSlug = null,
  promptSnippet,
  studentAnswer,
  correctAnswerReference,
  explanation = '',
  mistakeType = 'INCORRECT_CHOICE',
  categoryEvidence = '',
}) {
  // Infer mistake category if not explicitly given
  let categorizedType = mistakeType;
  let inferredEvidence = categoryEvidence;

  if (mistakeType === 'INCORRECT_CHOICE') {
    const promptLower = (promptSnippet || '').toLowerCase();
    if (promptLower.includes('syntax') || promptLower.includes('error') || promptLower.includes('bracket')) {
      categorizedType = 'SYNTAX';
      inferredEvidence = 'Derived from syntax keyword in problem context';
    } else if (promptLower.includes('async') || promptLower.includes('closure') || promptLower.includes('scope')) {
      categorizedType = 'CONCEPT';
      inferredEvidence = 'Core architectural/conceptual topic mismatch';
    } else {
      categorizedType = 'KNOWLEDGE_GAP';
      inferredEvidence = 'General knowledge omission on assessment attempt';
    }
  }

  // Check for prior mistakes on same topic/skill to detect repetition pattern
  const existingCount = await Mistake.countDocuments({
    studentId,
    topic,
  });

  const repetitionCount = existingCount + 1;

  const mistake = await Mistake.create({
    studentId,
    sourceType,
    sourceId,
    topic,
    skillSlug,
    promptSnippet,
    studentAnswer,
    correctAnswerReference,
    explanation,
    mistakeType: categorizedType,
    categoryConfidence: 'HIGH',
    categoryEvidence: inferredEvidence,
    repetitionCount,
    resolved: false,
  });

  // Automatically trigger spaced review schedule for repeated mistakes
  if (repetitionCount >= 2) {
    await scheduleSpacedReview({
      studentId,
      topic,
      resourceType: 'Topic',
      resourceId: mistake._id,
      performanceScore: 30,
      recallQuestion: `Review key concept for ${topic}: ${promptSnippet ? promptSnippet.slice(0, 100) : ''}`,
      recallAnswer: correctAnswerReference ? String(correctAnswerReference) : explanation,
    });
  }

  return mistake;
}

/**
 * Get Mistake Bank with pattern detection
 */
async function getMistakeBank(studentId, { resolved = false, category = null } = {}) {
  const query = { studentId };
  if (resolved !== undefined) query.resolved = resolved;
  if (category) query.mistakeType = category;

  const mistakes = await Mistake.find(query).sort({ createdAt: -1 }).lean();

  // Pattern detection: topics with >= 2 mistakes
  const topicFrequency = {};
  const categoryFrequency = {};

  for (const m of mistakes) {
    topicFrequency[m.topic] = (topicFrequency[m.topic] || 0) + 1;
    categoryFrequency[m.mistakeType] = (categoryFrequency[m.mistakeType] || 0) + 1;
  }

  const repeatedPatterns = Object.entries(topicFrequency)
    .filter(([_, count]) => count >= 2)
    .map(([topic, count]) => ({
      topic,
      repetitionCount: count,
      recommendation: `Multiple errors detected in ${topic}. Targeted active recall revision recommended.`,
    }));

  return {
    totalMistakes: mistakes.length,
    repeatedPatterns,
    categoryDistribution: categoryFrequency,
    mistakes,
  };
}

/**
 * Mark a mistake as resolved after successful active recall or practice
 */
async function resolveMistake(studentId, mistakeId) {
  const mistake = await Mistake.findOneAndUpdate(
    { _id: mistakeId, studentId },
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  );

  return mistake;
}

module.exports = {
  scheduleSpacedReview,
  recordReviewAttempt,
  getDueReviews,
  recordMistake,
  getMistakeBank,
  resolveMistake,
};
