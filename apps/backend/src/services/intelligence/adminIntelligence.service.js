const { LearningEvent } = require('../../models/learningEvent.model');
const { Recommendation } = require('../../models/recommendation.model');
const { LearningProfile } = require('../../models/learningProfile.model');
const { Goal } = require('../../models/goal.model');
const { Enrollment } = require('../../models/enrollment.model');
const { Course } = require('../../models/course.model');

class AdminIntelligenceService {
  /**
   * Platform-wide learning health dashboard
   */
  static async getPlatformLearningHealth() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active learners (distinct students with learning events in past 30 days)
    const activeLearnersCount = (await LearningEvent.distinct('studentId', {
      timestamp: { $gte: thirtyDaysAgo }
    })).length;

    const weeklyActiveLearners = (await LearningEvent.distinct('studentId', {
      timestamp: { $gte: sevenDaysAgo }
    })).length;

    // Course completion stats
    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ status: { $in: ['COMPLETED', 'completed'] } });
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Assessment & Coding Participation
    const totalQuizzesSubmitted = await LearningEvent.countDocuments({ eventType: 'QUIZ_SUBMITTED' });
    const totalCodingSolved = await LearningEvent.countDocuments({ eventType: 'CODING_SOLVED' });
    const totalLessonsCompleted = await LearningEvent.countDocuments({ eventType: 'LESSON_COMPLETED' });

    // Recommendation engagement
    const totalRecommendations = await Recommendation.countDocuments();
    const viewedRecommendations = await Recommendation.countDocuments({ status: { $in: ['viewed', 'completed', 'dismissed'] } });
    const completedRecommendations = await Recommendation.countDocuments({ status: 'completed' });
    const dismissedRecommendations = await Recommendation.countDocuments({ status: 'dismissed' });

    // Goals completion
    const totalGoals = await Goal.countDocuments();
    const completedGoals = await Goal.countDocuments({ status: 'COMPLETED' });
    const goalSuccessRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Common weak topics across all students
    const profiles = await LearningProfile.find({}, 'weakTopics').lean();
    const topicStruggleMap = {};
    for (const p of profiles) {
      for (const t of p.weakTopics || []) {
        topicStruggleMap[t.topic] = (topicStruggleMap[t.topic] || 0) + 1;
      }
    }
    const commonStrugglingTopics = Object.entries(topicStruggleMap)
      .map(([topic, count]) => ({ topic, studentCount: count }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 10);

    return {
      activeLearners: {
        monthly: activeLearnersCount,
        weekly: weeklyActiveLearners
      },
      courseHealth: {
        totalEnrollments,
        completedEnrollments,
        completionRate: `${completionRate}%`
      },
      activitySummary: {
        lessonsCompleted: totalLessonsCompleted,
        quizzesSubmitted: totalQuizzesSubmitted,
        codingSolved: totalCodingSolved
      },
      recommendations: {
        totalGenerated: totalRecommendations,
        viewed: viewedRecommendations,
        completed: completedRecommendations,
        dismissed: dismissedRecommendations,
        conversionRate: totalRecommendations > 0 ? `${Math.round((completedRecommendations / totalRecommendations) * 100)}%` : '0%'
      },
      goals: {
        total: totalGoals,
        completed: completedGoals,
        successRate: `${goalSuccessRate}%`
      },
      commonStrugglingTopics
    };
  }

  /**
   * Recommendation analytics (Section 55)
   */
  static async getRecommendationAnalytics() {
    const total = await Recommendation.countDocuments();
    const active = await Recommendation.countDocuments({ status: 'active' });
    const viewed = await Recommendation.countDocuments({ status: 'viewed' });
    const completed = await Recommendation.countDocuments({ status: 'completed' });
    const dismissed = await Recommendation.countDocuments({ status: 'dismissed' });

    // Feedback counts
    const helpful = await Recommendation.countDocuments({ 'feedback.rating': 'helpful' });
    const notHelpful = await Recommendation.countDocuments({ 'feedback.rating': 'not_helpful' });
    const notRelevant = await Recommendation.countDocuments({ 'feedback.rating': 'not_relevant' });

    // Breakdown by type
    const byType = await Recommendation.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
    ]);

    return {
      total,
      breakdown: { active, viewed, completed, dismissed },
      feedback: { helpful, notHelpful, notRelevant },
      byType: byType.map(b => ({
        type: b._id,
        count: b.count,
        completed: b.completed,
        completionRate: b.count > 0 ? `${Math.round((b.completed / b.count) * 100)}%` : '0%'
      }))
    };
  }

  /**
   * Platform engagement metrics (Section 45)
   */
  static async getEngagementAnalytics() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const eventTrends = await LearningEvent.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);

    return {
      trendsLast7Days: eventTrends
    };
  }
}

module.exports = { AdminIntelligenceService };
