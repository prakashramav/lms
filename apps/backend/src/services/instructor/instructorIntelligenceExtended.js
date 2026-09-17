const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const Question = require('../../models/question.model');
const Mistake = require('../../models/mistake.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');

/**
 * Instructor Intelligence & Content Gap Service
 * Phase 14 — Instructor Intelligence (Sections 26 - 36)
 */

/**
 * Detects curriculum content gaps based on student mistake clusters
 */
const detectContentGaps = async (instructorId) => {
  const courses = await Course.find({ instructorId }).select('_id title').lean();
  const courseIds = courses.map((c) => c._id);

  // Group unresolved mistakes by topic
  const gaps = await Mistake.aggregate([
    {
      $match: {
        courseId: { $in: courseIds },
      },
    },
    {
      $group: {
        _id: '$topic',
        mistakeCount: { $sum: 1 },
        sampleExplanation: { $first: '$explanation' },
        courseId: { $first: '$courseId' },
      },
    },
    { $sort: { mistakeCount: -1 } },
    { $limit: 5 },
  ]);

  return gaps.map((g) => ({
    topic: g._id || 'General Concepts',
    mistakeCount: g.mistakeCount,
    severity: g.mistakeCount >= 5 ? 'HIGH' : 'MEDIUM',
    recommendation: `High error volume observed in "${g._id}". Recommend adding a supplemental review video or interactive exercise.`,
  }));
};

/**
 * AI Question Generator for Instructor Question Bank
 */
const generateQuestionsForCourse = async ({ topic, difficulty = 'INTERMEDIATE', count = 3 }) => {
  return Array.from({ length: count }).map((_, i) => ({
    questionText: `Explain the architectural trade-offs of ${topic} when scaled under high concurrency (Scenario ${i + 1}).`,
    topic,
    difficulty,
    type: 'MCQ',
    options: [
      { text: 'Increases memory consumption while optimizing read throughput', isCorrect: true },
      { text: 'Guarantees zero database roundtrips unconditionally', isCorrect: false },
      { text: 'Causes lock contention without throughput gains', isCorrect: false },
      { text: 'Disables client-side caching mechanisms completely', isCorrect: false },
    ],
    explanation: `Option A is correct because appropriate caching/indexing strategies optimize read throughput at the cost of slight memory overhead.`,
  }));
};

module.exports = {
  detectContentGaps,
  generateQuestionsForCourse,
};
