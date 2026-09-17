const { Badge, StudentAchievement } = require('../../models/badge.model');

class AchievementService {
  /**
   * Retrieves all badges and indicates which ones the student has earned
   */
  async getStudentAchievements(studentId) {
    const allBadges = await Badge.find({ status: 'ACTIVE' }).lean();
    const earned = await StudentAchievement.find({ studentId }).lean();
    const earnedMap = new Map(earned.map((e) => [e.badgeId.toString(), e]));

    return allBadges.map((b) => {
      const achievement = earnedMap.get(b._id.toString());
      return {
        _id: b._id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        criteria: b.criteria,
        icon: b.icon,
        category: b.category,
        isEarned: !!achievement,
        earnedAt: achievement ? achievement.earnedAt : null,
      };
    });
  }

  /**
   * Evaluates and awards a badge if criteria met and not already awarded
   */
  async awardBadgeByCriteria(studentId, criteriaCode, metadata = {}) {
    const badge = await Badge.findOne({ criteria: criteriaCode, status: 'ACTIVE' });
    if (!badge) return null;

    const existing = await StudentAchievement.findOne({ studentId, badgeId: badge._id });
    if (existing) return existing;

    const achievement = await StudentAchievement.create({
      studentId,
      badgeId: badge._id,
      earnedAt: new Date(),
      metadata,
    });

    return achievement;
  }
}

module.exports = new AchievementService();
