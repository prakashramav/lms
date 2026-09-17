const { Skill } = require('../../models/skill.model');
const { Badge } = require('../../models/badge.model');
const FeatureFlag = require('../../models/featureFlag.model');

const INITIAL_SKILLS = [
  {
    name: 'JavaScript Fundamentals',
    slug: 'javascript-fundamentals',
    description: 'Core concepts including variables, loops, conditionals, and functions.',
    category: 'FRONTEND',
    difficulty: 'BEGINNER',
  },
  {
    name: 'Asynchronous JavaScript',
    slug: 'async-javascript',
    description: 'Promises, async/await, event loop, and callback handling.',
    category: 'FRONTEND',
    difficulty: 'INTERMEDIATE',
  },
  {
    name: 'React Components & Hooks',
    slug: 'react-hooks',
    description: 'Functional components, useState, useEffect, and custom hooks.',
    category: 'FRONTEND',
    difficulty: 'INTERMEDIATE',
  },
  {
    name: 'Node.js & Express REST APIs',
    slug: 'node-express-apis',
    description: 'Server architecture, middleware routing, and REST design.',
    category: 'BACKEND',
    difficulty: 'INTERMEDIATE',
  },
  {
    name: 'Database Modeling & Mongoose',
    slug: 'database-modeling-mongoose',
    description: 'Schema definition, indexes, relationships, and queries.',
    category: 'DATABASE',
    difficulty: 'INTERMEDIATE',
  },
  {
    name: 'Data Structures & Algorithms',
    slug: 'data-structures-algorithms',
    description: 'Arrays, hashes, recursion, two-pointer techniques, and complexity analysis.',
    category: 'ALGORITHMS',
    difficulty: 'INTERMEDIATE',
  },
];

const INITIAL_BADGES = [
  {
    name: 'First Steps',
    slug: 'first-course-started',
    description: 'Enrolled in your first career development course.',
    criteria: 'FIRST_COURSE',
    icon: 'Compass',
    category: 'LEARNING',
  },
  {
    name: 'Lesson Pioneer',
    slug: 'first-lesson-completed',
    description: 'Completed your very first lesson on ApexLearn.',
    criteria: 'FIRST_LESSON',
    icon: 'CheckCircle',
    category: 'LEARNING',
  },
  {
    name: 'Knowledge Seeker',
    slug: 'first-assessment-taken',
    description: 'Attempted and submitted your first quiz or assessment.',
    criteria: 'FIRST_ASSESSMENT',
    icon: 'Award',
    category: 'ASSESSMENT',
  },
  {
    name: 'Code Warrior',
    slug: 'first-coding-solved',
    description: 'Successfully passed all test cases for a coding problem in the sandbox.',
    criteria: 'FIRST_PROBLEM',
    icon: 'Code',
    category: 'PRACTICE',
  },
  {
    name: 'Relentless Learner',
    slug: 'streak-7-days',
    description: 'Maintained a continuous 7-day learning streak.',
    criteria: 'STREAK_7',
    icon: 'Flame',
    category: 'STREAK',
  },
  {
    name: 'Curriculum Graduate',
    slug: 'course-completed',
    description: 'Completed 100% of all lessons in an enrolled course.',
    criteria: 'COURSE_COMPLETE',
    icon: 'GraduationCap',
    category: 'MASTERY',
  },
  {
    name: 'Century Club',
    slug: 'questions-100-attempted',
    description: 'Practiced 100 assessment and quiz questions.',
    criteria: 'QUESTIONS_100',
    icon: 'Zap',
    category: 'ASSESSMENT',
  },
];

const INITIAL_FLAGS = [
  { key: 'LEARNING_INTELLIGENCE_ENABLED', description: 'Enable intelligence analysis & personalization layer', enabled: true },
  { key: 'PERSONALIZED_RECOMMENDATIONS_ENABLED', description: 'Enable explainable course & practice recommendations', enabled: true },
  { key: 'DAILY_PLAN_ENABLED', description: 'Enable daily study planning and task checklists', enabled: true },
  { key: 'SMART_REVISION_ENABLED', description: 'Enable spaced review queue and mistake book', enabled: true },
  { key: 'ACHIEVEMENTS_ENABLED', description: 'Enable badges, streaks, and milestone achievements', enabled: true },
  { key: 'ADAPTIVE_ASSESSMENT_ENABLED', description: 'Enable adaptive quiz difficulty targeting', enabled: true },
  { key: 'AI_WEEKLY_REVIEW_ENABLED', description: 'Enable data-grounded AI weekly progress narratives', enabled: true },
];

/**
 * Initializes foundational skills, badges, and feature flags if not present
 */
const seedIntelligenceBasics = async () => {
  try {
    for (const skill of INITIAL_SKILLS) {
      await Skill.findOneAndUpdate({ slug: skill.slug }, skill, { upsert: true, new: true });
    }

    for (const badge of INITIAL_BADGES) {
      await Badge.findOneAndUpdate({ slug: badge.slug }, badge, { upsert: true, new: true });
    }

    for (const flag of INITIAL_FLAGS) {
      await FeatureFlag.findOneAndUpdate(
        { key: flag.key },
        { description: flag.description, enabled: flag.enabled },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.warn('[Intelligence Seed Warning] Could not seed default intelligence items:', err.message);
  }
};

module.exports = {
  seedIntelligenceBasics,
  INITIAL_SKILLS,
  INITIAL_BADGES,
  INITIAL_FLAGS,
};
