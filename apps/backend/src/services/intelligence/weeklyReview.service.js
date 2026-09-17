const { LearningEvent } = require('../../models/learningEvent.model');
const intelligenceService = require('./intelligence.service');

class WeeklyReviewService {
  /**
   * Computes factual weekly learning summary and AI-assisted narrative
   */
  async getWeeklyReview(studentId) {
    const profile = await intelligenceService.getOrCreateProfile(studentId);

    const now = new Date();
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - 7);

    const startOfPreviousWeek = new Date(now);
    startOfPreviousWeek.setDate(now.getDate() - 14);

    // Fetch this week's events
    const currentWeekEvents = await LearningEvent.find({
      studentId,
      timestamp: { $gte: startOfCurrentWeek, $lte: now },
    }).lean();

    // Fetch previous week's events
    const previousWeekEvents = await LearningEvent.find({
      studentId,
      timestamp: { $gte: startOfPreviousWeek, $lt: startOfCurrentWeek },
    }).lean();

    const countEvents = (events, type) => events.filter((e) => e.eventType === type).length;

    const lessonsCurrent = countEvents(currentWeekEvents, 'LESSON_COMPLETED');
    const lessonsPrevious = countEvents(previousWeekEvents, 'LESSON_COMPLETED');

    const codingCurrent = countEvents(currentWeekEvents, 'CODING_SOLVED');
    const codingPrevious = countEvents(previousWeekEvents, 'CODING_SOLVED');

    const quizzesCurrent = countEvents(currentWeekEvents, 'QUIZ_SUBMITTED');
    const quizzesPrevious = countEvents(previousWeekEvents, 'QUIZ_SUBMITTED');

    const minutesCurrent = lessonsCurrent * 20 + codingCurrent * 25 + quizzesCurrent * 15;
    const minutesPrevious = lessonsPrevious * 20 + codingPrevious * 25 + quizzesPrevious * 15;

    // Distinct topics/skills practiced
    const practicedTopics = new Set();
    currentWeekEvents.forEach((e) => {
      if (e.metadata && e.metadata.topic) {
        practicedTopics.add(e.metadata.topic);
      }
    });

    const weakTopics = (profile.weakTopics || []).map((w) => w.topic);

    // Grounded Narrative (Deterministic or AI-assisted using actual numbers)
    let narrative = `You completed ${lessonsCurrent} lesson${lessonsCurrent === 1 ? '' : 's'} and solved ${codingCurrent} coding challenge${codingCurrent === 1 ? '' : 's'} this week.`;
    if (practicedTopics.size > 0) {
      narrative += ` Key topics explored: ${Array.from(practicedTopics).join(', ')}.`;
    }
    if (weakTopics.length > 0) {
      narrative += ` Consider scheduling a revision session for ${weakTopics[0]}.`;
    } else {
      narrative += ` Consistent learning momentum maintained across all topics!`;
    }

    return {
      period: {
        start: startOfCurrentWeek.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      currentWeek: {
        lessonsCompleted: lessonsCurrent,
        codingProblemsSolved: codingCurrent,
        quizzesTaken: quizzesCurrent,
        estimatedStudyMinutes: minutesCurrent,
      },
      previousWeek: {
        lessonsCompleted: lessonsPrevious,
        codingProblemsSolved: codingPrevious,
        quizzesTaken: quizzesPrevious,
        estimatedStudyMinutes: minutesPrevious,
      },
      practicedTopics: Array.from(practicedTopics),
      weakTopicsToReview: weakTopics,
      aiSummaryNarrative: narrative,
      aiSummary: narrative,
      streakDays: profile.learningVelocity?.currentStreakDays || 0,
    };
  }
}

module.exports = new WeeklyReviewService();
