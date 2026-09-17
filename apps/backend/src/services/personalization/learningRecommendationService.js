const mongoose = require('mongoose');
const { Enrollment } = require('../../models/enrollment.model');
const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const Mistake = require('../../models/mistake.model');
const { StudentSkill, Skill } = require('../../models/skill.model');
const { SkillRelationship } = require('../../models/skillRelationship.model');

/**
 * Smart Learning Recommendation & Adaptive Path Service
 * Phase 14 — Personalization Engine (Sections 8, 9, 10)
 */

/**
 * Computes the smart "Continue Learning" action
 */
const getSmartContinueLearning = async (studentId) => {
  // 1. Find the most recently accessed active enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    progressPercentage: { $lt: 100 },
  })
    .sort({ lastAccessedAt: -1, updatedAt: -1 })
    .populate('courseId')
    .lean();

  if (!enrollment || !enrollment.courseId) {
    return {
      actionType: 'EXPLORE_COURSES',
      title: 'Discover Your Next Course',
      description: 'You have completed your active courses or have not enrolled yet. Explore top recommendations tailored to your career goal.',
      course: null,
      lesson: null,
      reasonCodes: ['NO_ACTIVE_COURSES'],
      explanation: 'You do not currently have any courses in progress.',
    };
  }

  const course = enrollment.courseId;

  // 2. Check for recent unresolved mistakes or weak topics related to this course
  const recentMistake = await Mistake.findOne({
    studentId,
    resolved: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (recentMistake && recentMistake.topic) {
    // If a prerequisite weakness exists, recommend an adaptive concept review first
    return {
      actionType: 'CONCEPT_REVIEW',
      title: `Concept Review: ${recentMistake.topic}`,
      description: `Strengthen your understanding of ${recentMistake.topic} based on recent practice before advancing.`,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      },
      lesson: null,
      targetTopic: recentMistake.topic,
      reasonCodes: ['RECENT_MISTAKE', 'CONCEPT_WEAKNESS'],
      explanation: `Recommended because you recently struggled with "${recentMistake.topic}" during your assessment.`,
    };
  }

  // 3. Find the next incomplete lesson
  const completedLessonIds = (enrollment.completedLessons || []).map((id) => id.toString());
  const nextLesson = await Lesson.findOne({
    courseId: course._id,
    _id: { $nin: completedLessonIds },
  })
    .sort({ order: 1 })
    .lean();

  if (nextLesson) {
    return {
      actionType: 'NEXT_LESSON',
      title: nextLesson.title,
      description: `Continue in ${course.title}: Lesson ${nextLesson.order || 1}`,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      },
      lesson: {
        _id: nextLesson._id,
        title: nextLesson.title,
        durationMinutes: nextLesson.durationMinutes || 15,
        type: nextLesson.type || 'VIDEO',
      },
      progressPercentage: enrollment.progressPercentage || 0,
      reasonCodes: ['INCOMPLETE_LESSON', 'ACTIVE_COURSE'],
      explanation: `Recommended because this is the next sequential lesson in your enrolled course "${course.title}".`,
    };
  }

  // Fallback: Course completed or pending final assessment
  return {
    actionType: 'COURSE_ASSESSMENT',
    title: `Final Assessment for ${course.title}`,
    description: 'Complete the final assessment to earn your course certificate.',
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
    },
    lesson: null,
    reasonCodes: ['COURSE_COMPLETION_PENDING'],
    explanation: 'All lessons completed! Ready for assessment.',
  };
};

/**
 * Recommends adaptive remediation if a topic has a low score
 */
const getAdaptiveRemediation = async (studentId, topic) => {
  return {
    topic,
    remediationSteps: [
      { step: 1, type: 'CONCEPT_REVIEW', action: `Review core concept notes on ${topic}` },
      { step: 2, type: 'PRACTICE_DRILL', action: `Practice 5 targeted diagnostic questions on ${topic}` },
      { step: 3, type: 'MINI_ASSESSMENT', action: `Validate mastery with a 3-question check` },
      { step: 4, type: 'RESUME_PATH', action: `Return to main curriculum once mastery is demonstrated` },
    ],
    reasonCodes: ['ADAPTIVE_REMEDIATION'],
    explanation: `Adaptive pathway generated to address difficulty identified in ${topic}.`,
  };
};

module.exports = {
  getSmartContinueLearning,
  getAdaptiveRemediation,
};
