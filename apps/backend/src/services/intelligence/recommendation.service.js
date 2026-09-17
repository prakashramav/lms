const { Recommendation } = require('../../models/recommendation.model');
const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const Assessment = require('../../models/assessment.model');
const { Problem } = require('../../models/problem.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const intelligenceService = require('./intelligence.service');

class RecommendationService {
  /**
   * Generates or retrieves prioritized recommendations for a student
   * Strictly recommends only published, existing resources from MongoDB
   */
  async getRecommendations(studentId) {
    // 1. Fetch active learning profile
    const profile = await intelligenceService.getOrCreateProfile(studentId);
    if (profile.preferences && profile.preferences.personalizedRecommendations === false) {
      return [];
    }

    const recommendations = [];

    // SIGNAL 1: Continue Current Lesson / Next Lesson in Active Enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      status: 'ACTIVE',
    })
      .sort({ updatedAt: -1 })
      .populate('courseId');

    if (enrollment && enrollment.courseId && enrollment.courseId.isPublished) {
      const course = enrollment.courseId;
      // Find uncompleted lesson
      const completedProgress = await Progress.find({
        studentId,
        courseId: course._id,
        isCompleted: true,
      }).select('lessonId');
      const completedLessonIds = completedProgress.map((p) => p.lessonId.toString());

      const nextLesson = await Lesson.findOne({
        courseId: course._id,
        isPublished: true,
        _id: { $nin: completedLessonIds },
      }).sort({ order: 1 });

      if (nextLesson) {
        recommendations.push({
          studentId,
          type: 'CONTINUE_LESSON',
          title: `Continue: ${nextLesson.title}`,
          reason: `Continue your progress in "${course.title}".`,
          resourceType: 'Lesson',
          resourceId: nextLesson._id,
          slug: course.slug,
          priority: 95,
          estimatedTime: nextLesson.duration || 15,
          status: 'PENDING',
        });
      }
    }

    // SIGNAL 2: Weak Topic Practice Quiz or Problem
    if (profile.weakTopics && profile.weakTopics.length > 0) {
      const primaryWeak = profile.weakTopics[0];

      // Look for a coding problem tagged with this weak topic
      const practiceProblem = await Problem.findOne({
        isPublished: true,
        $or: [
          { tags: { $regex: new RegExp(primaryWeak.topic, 'i') } },
          { category: { $regex: new RegExp(primaryWeak.topic, 'i') } },
        ],
      });

      if (practiceProblem) {
        recommendations.push({
          studentId,
          type: 'PRACTICE_PROBLEM',
          title: `Practice Coding: ${practiceProblem.title}`,
          reason: `Recommended because you had difficulty with ${primaryWeak.topic} in recent challenges.`,
          resourceType: 'Problem',
          resourceId: practiceProblem._id,
          slug: practiceProblem.slug,
          priority: 88,
          estimatedTime: 20,
          status: 'PENDING',
        });
      }

      // Look for an assessment on this topic
      const quiz = await Assessment.findOne({
        isPublished: true,
        title: { $regex: new RegExp(primaryWeak.topic, 'i') },
      });

      if (quiz) {
        recommendations.push({
          studentId,
          type: 'PRACTICE_QUIZ',
          title: `Quiz Review: ${quiz.title}`,
          reason: `Recommended to strengthen your understanding of ${primaryWeak.topic}.`,
          resourceType: 'Assessment',
          resourceId: quiz._id,
          slug: quiz.slug,
          priority: 85,
          estimatedTime: quiz.duration || 15,
          status: 'PENDING',
        });
      }
    }

    // SIGNAL 3: Practice Problem if no weak topic
    if (recommendations.length < 3) {
      const popularProblem = await Problem.findOne({ isPublished: true }).sort({ totalSubmissions: -1 });
      if (popularProblem && !recommendations.some((r) => r.resourceId.toString() === popularProblem._id.toString())) {
        recommendations.push({
          studentId,
          type: 'PRACTICE_PROBLEM',
          title: `Featured Problem: ${popularProblem.title}`,
          reason: `Sharpen your coding skills with one of the most practiced challenges.`,
          resourceType: 'Problem',
          resourceId: popularProblem._id,
          slug: popularProblem.slug,
          priority: 70,
          estimatedTime: 20,
          status: 'PENDING',
        });
      }
    }

    // SIGNAL 4: Fallback Discovery Course
    if (recommendations.length < 3) {
      const topCourse = await Course.findOne({ isPublished: true, status: 'PUBLISHED' }).sort({ createdAt: -1 });
      if (topCourse && (!enrollment || enrollment.courseId?._id.toString() !== topCourse._id.toString())) {
        recommendations.push({
          studentId,
          type: 'START_MODULE',
          title: `Explore Course: ${topCourse.title}`,
          reason: `High-demand curriculum recommended for your career path.`,
          resourceType: 'Course',
          resourceId: topCourse._id,
          slug: topCourse.slug,
          priority: 60,
          estimatedTime: 30,
          status: 'PENDING',
        });
      }
    }

    // Persist / update generated recommendations in DB
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const saved = await Recommendation.findOneAndUpdate(
        { studentId, resourceId: rec.resourceId, type: rec.type },
        rec,
        { upsert: true, new: true }
      );
      savedRecommendations.push(saved);
    }

    return savedRecommendations
      .filter((r) => r.status !== 'DISMISSED')
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Records student feedback on a recommendation
   */
  async submitFeedback(studentId, recommendationId, feedback) {
    const validFeedbacks = ['HELPFUL', 'NOT_HELPFUL', 'NOT_RELEVANT'];
    if (!validFeedbacks.includes(feedback)) {
      throw new Error('INVALID_FEEDBACK_TYPE');
    }

    const rec = await Recommendation.findOne({ _id: recommendationId, studentId });
    if (!rec) {
      const err = new Error('RECOMMENDATION_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    rec.feedback = feedback;
    await rec.save();
    return rec;
  }

  /**
   * Dismisses a recommendation
   */
  async dismissRecommendation(studentId, recommendationId) {
    const rec = await Recommendation.findOne({ _id: recommendationId, studentId });
    if (!rec) {
      const err = new Error('RECOMMENDATION_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    rec.status = 'DISMISSED';
    await rec.save();
    return rec;
  }
}

module.exports = new RecommendationService();
