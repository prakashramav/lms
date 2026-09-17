const crypto = require('crypto');
const { LearningEvent } = require('../../models/learningEvent.model');
const { LearningProfile } = require('../../models/learningProfile.model');

/**
 * Service for ingesting, deduplicating, and auditing student learning events.
 */
class LearningEventService {
  /**
   * Records a validated learning event and updates user streak/velocity
   */
  async recordEvent({ studentId, eventType, resourceType = 'Lesson', resourceId = null, metadata = {}, eventId = null }) {
    if (!studentId || !eventType) return null;

    const finalEventId = eventId || crypto.randomUUID();

    // Idempotency: check if event already recorded
    const existing = await LearningEvent.findOne({ eventId: finalEventId });
    if (existing) return existing;

    const event = await LearningEvent.create({
      studentId,
      eventType,
      resourceType,
      resourceId,
      metadata,
      eventId: finalEventId,
      timestamp: new Date(),
    });

    // Update streak and learning velocity
    await this.updateStreakAndVelocity(studentId);

    return event;
  }

  /**
   * Computes streak days and activity counts from verified events
   */
  async updateStreakAndVelocity(studentId) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find or create learning profile
    let profile = await LearningProfile.findOne({ studentId });
    if (!profile) {
      profile = await LearningProfile.create({ studentId });
    }

    const velocity = profile.learningVelocity || {
      lessonsCompletedThisWeek: 0,
      questionsAnsweredThisWeek: 0,
      codingProblemsThisWeek: 0,
      estimatedMinutesThisWeek: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastActiveDate: null,
    };

    // Check last active date
    if (velocity.lastActiveDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (velocity.lastActiveDate === yesterdayStr) {
        velocity.currentStreakDays += 1;
      } else if (!velocity.lastActiveDate) {
        velocity.currentStreakDays = 1;
      } else {
        velocity.currentStreakDays = 1; // streak reset
      }

      if (velocity.currentStreakDays > (velocity.longestStreakDays || 0)) {
        velocity.longestStreakDays = velocity.currentStreakDays;
      }

      velocity.lastActiveDate = todayStr;
    }

    // Calculate this week's activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [lessonsCount, codingCount] = await Promise.all([
      LearningEvent.countDocuments({
        studentId,
        eventType: 'LESSON_COMPLETED',
        timestamp: { $gte: oneWeekAgo },
      }),
      LearningEvent.countDocuments({
        studentId,
        eventType: 'CODING_SOLVED',
        timestamp: { $gte: oneWeekAgo },
      }),
    ]);

    velocity.lessonsCompletedThisWeek = lessonsCount;
    velocity.codingProblemsThisWeek = codingCount;
    velocity.estimatedMinutesThisWeek = lessonsCount * 15 + codingCount * 25;

    profile.learningVelocity = velocity;
    profile.lastAnalyzedAt = new Date();
    await profile.save();

    return profile;
  }

  /**
   * Retrieves paginated recent learning events for a student
   */
  async getStudentEvents(studentId, { limit = 20 } = {}) {
    return LearningEvent.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new LearningEventService();
