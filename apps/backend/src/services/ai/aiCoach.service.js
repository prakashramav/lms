const { getComprehensiveStudentProfile } = require('../personalization/studentProfileService');

/**
 * Multi-Mode AI Learning Coach Service
 * Phase 14 — AI Learning Coach (Sections 15, 16, 17)
 */

const COACH_MODES = ['EXPLAIN', 'PRACTICE', 'REVIEW', 'PLAN', 'DEBUG', 'INTERVIEW', 'CAREER'];

/**
 * Handles interactive coaching query with isolated student context
 */
const handleCoachInteraction = async ({ studentId, mode = 'EXPLAIN', prompt, context = {} }) => {
  const normalizedMode = mode.toUpperCase();
  const safeMode = COACH_MODES.includes(normalizedMode) ? normalizedMode : 'EXPLAIN';

  // 1. Fetch authorized student profile context
  const profile = await getComprehensiveStudentProfile(studentId);

  // 2. Generate personalized coaching response based on mode
  let responseContent = '';
  let followUpSuggestions = [];

  switch (safeMode) {
    case 'EXPLAIN':
      responseContent = `Here is a clear breakdown of "${prompt}": In modern software architecture, breaking down concepts into modular components allows scalable code organization and easier debugging. Let's look at a concrete example...`;
      followUpSuggestions = ['Can you show a code example?', 'How does this compare to alternatives?', 'Give me a practice problem on this.'];
      break;

    case 'PRACTICE':
      responseContent = `Based on your recent progress in ${profile.targetCareer}, let's practice this scenario: You are building a high-throughput endpoint that requires caching. How would you prevent a cache stampede?`;
      followUpSuggestions = ['I think using a mutex/lock works.', 'Use probabilistic early expiration.', 'Explain the solution.'];
      break;

    case 'REVIEW':
      responseContent = `Reviewing your recent learning topics (${profile.recentMistakeTopics.join(', ') || 'Core Algorithms'}): Focus on asynchronous promise chains and state synchronization.`;
      followUpSuggestions = ['Start a quick 3-question quiz.', 'Show mistake explanation.', 'Mark topic as understood.'];
      break;

    case 'PLAN':
      responseContent = `Based on your goal to become a ${profile.targetCareer}, your priority today is: 1) Complete the remaining lessons in your active course, 2) Practice 3 coding challenges, and 3) Review portfolio readiness.`;
      followUpSuggestions = ['Adjust for 2 hours today.', 'Focus purely on coding.', 'Save to my daily plan.'];
      break;

    case 'DEBUG':
      responseContent = `Debugging analysis for your code: Check whether your asynchronous functions have unhandled rejections and ensure state mutations occur immutably.`;
      followUpSuggestions = ['Show corrected code.', 'Why did this cause a memory leak?', 'How can I test this edge case?'];
      break;

    case 'INTERVIEW':
      responseContent = `Mock Interview Question for ${profile.targetCareer}: "Can you explain how database indexing impacts read versus write latency?" Take 60 seconds to outline your answer.`;
      followUpSuggestions = ['Indexes speed up reads via B-Trees but slow down writes due to index updates.', 'Provide sample answer.', 'Next question.'];
      break;

    case 'CAREER':
      responseContent = `Career guidance for ${profile.targetCareer}: Your resume is ${profile.resumeCompleted ? 'well-structured' : 'pending completion'}. To stand out to hiring partners, highlight quantifiable impact in your project descriptions.`;
      followUpSuggestions = ['Review ATS keyword score.', 'Explore top matched jobs.', 'Schedule mock interview.'];
      break;

    default:
      responseContent = `I am your AI Learning Coach. How can I assist your study goals today?`;
      followUpSuggestions = ['Explain a topic', 'Give me practice', 'Review my progress'];
  }

  return {
    mode: safeMode,
    response: responseContent,
    followUpSuggestions,
    contextSummary: {
      targetCareer: profile.targetCareer,
      activeCoursesCount: profile.activeCoursesCount,
      strongSkillsCount: profile.strongSkills.length,
    },
  };
};

module.exports = {
  handleCoachInteraction,
  COACH_MODES,
};
