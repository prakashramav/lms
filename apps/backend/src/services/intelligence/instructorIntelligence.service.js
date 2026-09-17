const { Course } = require('../../models/course.model');
const { Enrollment } = require('../../models/enrollment.model');
const { Lesson } = require('../../models/lesson.model');
const Progress = require('../../models/progress.model');
const Mistake = require('../../models/mistake.model');
const Assessment = require('../../models/assessment.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { LearningProfile } = require('../../models/learningProfile.model');

class InstructorIntelligenceService {
  /**
   * Retrieves aggregate intelligence metrics for a specific instructor course
   */
  async getCourseIntelligence(courseId, instructorId) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      const err = new Error('COURSE_NOT_FOUND_OR_UNAUTHORIZED');
      err.statusCode = 404;
      throw err;
    }

    // 1. Enrollment & Completion Funnel
    const [totalEnrolled, completedEnrollments, activeEnrollments] = await Promise.all([
      Enrollment.countDocuments({ courseId }),
      Enrollment.countDocuments({ courseId, status: { $in: ['COMPLETED', 'completed'] } }),
      Enrollment.countDocuments({ courseId, status: { $in: ['ACTIVE', 'active'] } }),
    ]);

    const completionRate = totalEnrolled > 0
      ? Math.round((completedEnrollments / totalEnrolled) * 100)
      : 0;

    // 2. Lesson Completion Rates & Drop-Off Points
    const lessons = await Lesson.find({ courseId, isPublished: true }).sort({ order: 1 }).lean();
    const lessonAnalytics = [];

    for (const lesson of lessons) {
      const completedCount = await Progress.countDocuments({
        courseId,
        lessonId: lesson._id,
        isCompleted: true,
      });

      const dropOffPercent = totalEnrolled > 0
        ? Math.max(0, Math.round(((totalEnrolled - completedCount) / totalEnrolled) * 100))
        : 0;

      lessonAnalytics.push({
        lessonId: lesson._id,
        title: lesson.title,
        order: lesson.order,
        completedCount,
        dropOffPercent,
      });
    }

    // 3. Common Mistake Topics in this course
    const courseAssessments = await Assessment.find({ courseId }).select('_id');
    const assessmentIds = courseAssessments.map((a) => a._id);

    const attempts = await AssessmentAttempt.find({
      assessmentId: { $in: assessmentIds },
      status: 'COMPLETED',
    }).lean();

    const topicMisses = {};
    attempts.forEach((att) => {
      (att.answers || []).forEach((ans) => {
        if (!ans.isCorrect) {
          const topic = ans.topic || 'Curriculum Concepts';
          topicMisses[topic] = (topicMisses[topic] || 0) + 1;
        }
      });
    });

    const commonWeakTopics = Object.entries(topicMisses)
      .map(([topic, count]) => ({ topic, mistakeCount: count }))
      .sort((a, b) => b.mistakeCount - a.mistakeCount)
      .slice(0, 5);

    // 4. Students who "May need support" (signals: low progress, or inactive > 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const strugglingEnrollments = await Enrollment.find({
      courseId,
      status: 'ACTIVE',
      $or: [
        { progressPercentage: { $lt: 30 }, updatedAt: { $lt: sevenDaysAgo } },
        { updatedAt: { $lt: sevenDaysAgo } },
      ],
    })
      .populate('studentId', 'name email avatar')
      .limit(10)
      .lean();

    const studentsNeedingSupport = strugglingEnrollments.map((e) => ({
      enrollmentId: e._id,
      student: e.studentId,
      progressPercentage: e.progressPercentage,
      lastActive: e.updatedAt,
      signal: e.progressPercentage < 20 ? 'Slow initial onboarding' : 'Inactive over 7 days',
    }));

    return {
      course: {
        id: course._id,
        title: course.title,
        slug: course.slug,
      },
      funnel: {
        totalEnrolled,
        activeEnrollments,
        completedEnrollments,
        completionRate,
      },
      lessonAnalytics,
      commonWeakTopics,
      studentsNeedingSupport,
      supportSignals: studentsNeedingSupport,
    };
  }

  /**
   * Retrieves course common mistakes
   */
  async getCommonMistakes(courseId, instructorId) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      const err = new Error('COURSE_NOT_FOUND_OR_UNAUTHORIZED');
      err.statusCode = 404;
      throw err;
    }

    const mistakes = await Mistake.find({
      topic: { $exists: true },
    })
      .sort({ retryCount: -1, createdAt: -1 })
      .limit(20)
      .lean();

    return mistakes;
  }
}

module.exports = new InstructorIntelligenceService();
