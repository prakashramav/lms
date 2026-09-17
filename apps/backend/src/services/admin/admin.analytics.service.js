const { User } = require('../../models/user.model');
const { Course } = require('../../models/course.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { Submission } = require('../../models/submission.model');
const { AIMessage } = require('../../models/aiMessage.model');
const { AIConversation } = require('../../models/aiConversation.model');

class AdminAnalyticsService {
  /**
   * Global KPI Overview for Admin Dashboard
   */
  async getOverviewKPIs() {
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      pendingCourses,
      pendingInstructors,
      totalEnrollments,
      completedEnrollments,
      activeUsers,
      totalAssessmentAttempts,
      passedAssessmentAttempts,
      totalSubmissions,
      acceptedSubmissions,
      totalAiMessages,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'INSTRUCTOR' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'PUBLISHED' }),
      Course.countDocuments({ status: 'PENDING_REVIEW' }),
      User.countDocuments({ role: 'INSTRUCTOR', status: 'PENDING' }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'COMPLETED' }),
      User.countDocuments({ status: 'ACTIVE' }),
      AssessmentAttempt.countDocuments(),
      AssessmentAttempt.countDocuments({ passed: true }),
      Submission.countDocuments(),
      Submission.countDocuments({ verdict: 'ACCEPTED' }),
      AIMessage.countDocuments().catch(() => 0),
    ]);

    const completionRate =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const assessmentPassRate =
      totalAssessmentAttempts > 0
        ? Math.round((passedAssessmentAttempts / totalAssessmentAttempts) * 100)
        : 0;

    const codingAcceptanceRate =
      totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    return {
      kpis: {
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        pendingApprovals: pendingCourses + pendingInstructors,
        pendingCourses,
        pendingInstructors,
        totalEnrollments,
        activeUsers,
        completionRate,
        totalAssessmentAttempts,
        assessmentPassRate,
        totalSubmissions,
        codingAcceptanceRate,
        aiRequests: totalAiMessages,
      },
    };
  }

  /**
   * User Growth and Telemetry
   */
  async getUserAnalytics() {
    const [roleDistribution, statusDistribution, recentRegistrations] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.find()
        .select('name email role status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return {
      roleDistribution: roleDistribution.map((r) => ({ role: r._id, count: r.count })),
      statusDistribution: statusDistribution.map((s) => ({ status: s._id, count: s.count })),
      recentRegistrations,
    };
  }

  /**
   * Course Enrollment & Engagement Analytics
   */
  async getCourseAnalytics() {
    const topEnrolled = await Enrollment.aggregate([
      { $group: { _id: '$courseId', enrollmentsCount: { $sum: 1 } } },
      { $sort: { enrollmentsCount: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 1,
          enrollmentsCount: 1,
          title: '$course.title',
          category: '$course.category',
          status: '$course.status',
        },
      },
    ]);

    const categoryDistribution = await Course.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      topEnrolled,
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id || 'Uncategorized',
        count: c.count,
      })),
    };
  }

  /**
   * Learning & Assessment Metrics
   */
  async getLearningAnalytics() {
    const [totalCompletedLessons, avgScoreResult] = await Promise.all([
      Progress.countDocuments({ isCompleted: true }),
      AssessmentAttempt.aggregate([
        { $match: { status: 'SUBMITTED' } },
        { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
      ]),
    ]);

    const averageAssessmentScore = avgScoreResult[0]
      ? Math.round(avgScoreResult[0].avgScore)
      : 0;

    return {
      totalCompletedLessons,
      averageAssessmentScore,
    };
  }

  /**
   * Operational AI Telemetry & Usage Monitoring
   */
  async getAiMonitoring() {
    const totalAiConversations = await AIConversation.countDocuments().catch(() => 0);
    const totalAiMessages = await AIMessage.countDocuments().catch(() => 0);

    // Estimate tokens (approx 4 chars per token)
    const messages = await AIMessage.find().select('content role').limit(500).lean().catch(() => []);
    let estimatedTokens = 0;
    messages.forEach((m) => {
      if (m.content) estimatedTokens += Math.round(m.content.length / 4);
    });

    return {
      totalConversations: totalAiConversations,
      totalMessages: totalAiMessages,
      estimatedTokens: estimatedTokens || totalAiMessages * 80,
      activeModel: 'gemini-1.5-flash / simulated-rag',
      healthStatus: 'OPERATIONAL',
      errorCount: 0,
    };
  }
}

module.exports = new AdminAnalyticsService();
