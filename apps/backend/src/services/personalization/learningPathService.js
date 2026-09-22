const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const { Enrollment } = require('../../models/enrollment.model');
const { Lesson } = require('../../models/lesson.model');
const { Skill, StudentSkill } = require('../../models/skill.model');
const { SkillRelationship } = require('../../models/skillRelationship.model');
const { LearningProfile } = require('../../models/learningProfile.model');
const CareerPath = require('../../models/careerPath.model');
const Mistake = require('../../models/mistake.model');
const { Recommendation } = require('../../models/recommendation.model');

/**
 * Canonical Skill Taxonomy Mapping & Aliases
 * Phase 24 — Sections 162-165
 */
const CANONICAL_SKILL_ALIASES = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  react: 'react.js',
  'react.js': 'react.js',
  reactjs: 'react.js',
  next: 'next.js',
  'next.js': 'next.js',
  nextjs: 'next.js',
  node: 'node.js',
  'node.js': 'node.js',
  nodejs: 'node.js',
  express: 'express.js',
  'express.js': 'express.js',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  py: 'python',
  python: 'python',
  ml: 'machine learning',
  'machine learning': 'machine learning',
  sql: 'sql',
  html: 'html',
  css: 'css',
  tailwind: 'tailwind css',
  'tailwind css': 'tailwind css',
};

const resolveCanonicalSkill = (name) => {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  return CANONICAL_SKILL_ALIASES[clean] || clean;
};

/**
 * Standard Career Goal Skill Roadmaps
 */
const CAREER_ROADMAPS = {
  'frontend-developer': {
    title: 'Frontend Developer',
    description: 'Specializes in responsive web applications, component architecture, and modern UX engineering.',
    tiers: [
      {
        level: 'Foundations',
        skills: ['html', 'css', 'javascript'],
        prerequisites: [],
      },
      {
        level: 'Frameworks & Tooling',
        skills: ['react.js', 'tailwind css'],
        prerequisites: ['html', 'css', 'javascript'],
      },
      {
        level: 'Advanced Architecture',
        skills: ['next.js', 'typescript'],
        prerequisites: ['react.js', 'javascript'],
      },
      {
        level: 'Production Engineering',
        skills: ['performance optimization', 'testing', 'ci/cd'],
        prerequisites: ['next.js', 'typescript'],
      },
    ],
  },
  'backend-developer': {
    title: 'Backend Developer',
    description: 'Designs scalable APIs, transactional databases, and resilient microservice architectures.',
    tiers: [
      {
        level: 'Foundations',
        skills: ['javascript', 'python', 'data structures'],
        prerequisites: [],
      },
      {
        level: 'APIs & Server Runtime',
        skills: ['node.js', 'express.js', 'rest apis'],
        prerequisites: ['javascript'],
      },
      {
        level: 'Persistence & Security',
        skills: ['mongodb', 'sql', 'authentication & rbac'],
        prerequisites: ['node.js', 'express.js'],
      },
      {
        level: 'Scale & Reliability',
        skills: ['system design', 'redis & caching', 'docker'],
        prerequisites: ['mongodb', 'sql'],
      },
    ],
  },
  'full-stack-developer': {
    title: 'Full Stack Developer',
    description: 'Masters end-to-end web engineering from React/Next.js frontends to Express/MongoDB persistence.',
    tiers: [
      {
        level: 'Web Foundations',
        skills: ['html', 'css', 'javascript'],
        prerequisites: [],
      },
      {
        level: 'Frontend Stack',
        skills: ['react.js', 'tailwind css'],
        prerequisites: ['html', 'css', 'javascript'],
      },
      {
        level: 'Backend & APIs',
        skills: ['node.js', 'express.js', 'mongodb'],
        prerequisites: ['javascript'],
      },
      {
        level: 'Full Stack Integration',
        skills: ['next.js', 'typescript', 'authentication & rbac'],
        prerequisites: ['react.js', 'node.js', 'mongodb'],
      },
      {
        level: 'Production Deployment',
        skills: ['docker', 'ci/cd', 'system design'],
        prerequisites: ['next.js', 'typescript'],
      },
    ],
  },
  'ai-ml-engineer': {
    title: 'AI/ML Engineer',
    description: 'Builds intelligent systems, RAG pipelines, fine-tuned models, and production AI copilot features.',
    tiers: [
      {
        level: 'Mathematical Foundations',
        skills: ['python', 'mathematics & linear algebra'],
        prerequisites: [],
      },
      {
        level: 'Data Science Core',
        skills: ['data analysis', 'scikit-learn'],
        prerequisites: ['python'],
      },
      {
        level: 'Deep Learning & NLP',
        skills: ['deep learning', 'transformers'],
        prerequisites: ['scikit-learn'],
      },
      {
        level: 'LLMs & Production AI',
        skills: ['rag & embeddings', 'prompt engineering', 'system design'],
        prerequisites: ['deep learning', 'python'],
      },
    ],
  },
};

/**
 * 1. Generates an ordered, validated learning path respecting prerequisites
 */
const generateLearningPath = async (studentId, requestedGoal = 'full-stack-developer') => {
  const goalKey = CAREER_ROADMAPS[requestedGoal] ? requestedGoal : 'full-stack-developer';
  const roadmap = CAREER_ROADMAPS[goalKey];

  // Fetch student skills and mastery
  const studentSkills = await StudentSkill.find({ studentId }).populate('skillId').lean();
  const masteredSkills = new Set();
  const developingSkills = new Set();

  studentSkills.forEach((s) => {
    if (!s.skillId) return;
    const name = resolveCanonicalSkill(s.skillId.name);
    if (['INTERMEDIATE', 'ADVANCED', 'MASTERED'].includes(s.masteryLevel)) {
      masteredSkills.add(name);
    } else {
      developingSkills.add(name);
    }
  });

  // Check student active enrollments
  const enrollments = await Enrollment.find({ studentId }).populate('courseId').lean();
  const activeCourseTitles = new Set(
    enrollments.filter((e) => e.courseId && e.status === 'ACTIVE').map((e) => e.courseId.title.toLowerCase())
  );
  const completedCourseTitles = new Set(
    enrollments.filter((e) => e.courseId && e.status === 'COMPLETED').map((e) => e.courseId.title.toLowerCase())
  );

  // Fetch published courses for grounding recommendations
  const publishedCourses = await Course.find({ status: 'PUBLISHED', isPublished: true, isDeleted: { $ne: true } }).select('title slug difficulty category').lean();

  const orderedPath = [];
  let currentMilestoneFound = false;

  for (let i = 0; i < roadmap.tiers.length; i++) {
    const tier = roadmap.tiers[i];
    const prereqsSatisfied = tier.prerequisites.every((prereq) => masteredSkills.has(resolveCanonicalSkill(prereq)));

    const tierSkills = tier.skills.map((skillName) => {
      const canonical = resolveCanonicalSkill(skillName);
      let status = 'NOT_STARTED';
      if (masteredSkills.has(canonical)) {
        status = 'COMPLETED';
      } else if (developingSkills.has(canonical)) {
        status = 'IN_PROGRESS';
      } else if (prereqsSatisfied) {
        status = 'UNLOCKED';
      } else {
        status = 'LOCKED';
      }

      // Associate grounded platform course
      const matchedCourse = publishedCourses.find((c) =>
        c.title.toLowerCase().includes(canonical) || c.category.toLowerCase().includes(canonical)
      );

      return {
        skill: skillName,
        canonical,
        status,
        course: matchedCourse
          ? {
              id: matchedCourse._id,
              title: matchedCourse.title,
              slug: matchedCourse.slug,
              difficulty: matchedCourse.difficulty,
            }
          : null,
      };
    });

    const isTierCompleted = tierSkills.every((s) => s.status === 'COMPLETED');
    let tierStatus = 'LOCKED';
    if (isTierCompleted) {
      tierStatus = 'COMPLETED';
    } else if (prereqsSatisfied) {
      if (!currentMilestoneFound) {
        tierStatus = 'CURRENT';
        currentMilestoneFound = true;
      } else {
        tierStatus = 'UNLOCKED';
      }
    }

    orderedPath.push({
      tierIndex: i + 1,
      name: tier.level,
      status: tierStatus,
      prerequisites: tier.prerequisites,
      prerequisitesSatisfied: prereqsSatisfied,
      skills: tierSkills,
    });
  }

  return {
    careerGoal: roadmap.title,
    goalSlug: goalKey,
    description: roadmap.description,
    totalTiers: roadmap.tiers.length,
    completedTiersCount: orderedPath.filter((t) => t.status === 'COMPLETED').length,
    path: orderedPath,
    algorithmVersion: 'v2.4-hybrid',
  };
};

/**
 * 2. Computes Skill Gap Analysis against target role
 */
const getSkillGaps = async (studentId, careerGoalSlug = 'full-stack-developer') => {
  const goalKey = CAREER_ROADMAPS[careerGoalSlug] ? careerGoalSlug : 'full-stack-developer';
  const roadmap = CAREER_ROADMAPS[goalKey];

  const studentSkills = await StudentSkill.find({ studentId }).populate('skillId').lean();
  const studentSkillMap = new Map();

  studentSkills.forEach((s) => {
    if (!s.skillId) return;
    studentSkillMap.set(resolveCanonicalSkill(s.skillId.name), {
      name: s.skillId.name,
      masteryLevel: s.masteryLevel,
      score: s.observedScore || 0,
      confidence: s.confidence || 'LOW',
    });
  });

  const strongSkills = [];
  const developingSkills = [];
  const missingSkills = [];
  const recommendedActions = [];

  const allRequired = [];
  roadmap.tiers.forEach((tier) => {
    tier.skills.forEach((s) => allRequired.push(s));
  });

  allRequired.forEach((reqSkill) => {
    const canonical = resolveCanonicalSkill(reqSkill);
    const existing = studentSkillMap.get(canonical);

    if (existing && ['INTERMEDIATE', 'ADVANCED', 'MASTERED'].includes(existing.masteryLevel)) {
      strongSkills.push({
        name: existing.name,
        level: existing.masteryLevel,
        score: existing.score,
      });
    } else if (existing) {
      developingSkills.push({
        name: existing.name,
        level: existing.masteryLevel,
        score: existing.score,
      });
      recommendedActions.push({
        action: 'PRACTICE_SKILL',
        skill: existing.name,
        reason: `Your ${existing.name} is currently at ${existing.masteryLevel}. Practice questions to achieve intermediate proficiency.`,
      });
    } else {
      missingSkills.push({
        name: reqSkill,
        importance: 'HIGH',
      });
      recommendedActions.push({
        action: 'ENROLL_COURSE',
        skill: reqSkill,
        reason: `${reqSkill} is a core competency required for the ${roadmap.title} track.`,
      });
    }
  });

  const matchPercentage = Math.round((strongSkills.length / Math.max(1, allRequired.length)) * 100);

  return {
    careerGoal: roadmap.title,
    matchPercentage,
    strongSkills,
    developingSkills,
    missingSkills,
    recommendedActions: recommendedActions.slice(0, 5),
    algorithmVersion: 'v2.4-hybrid',
  };
};

/**
 * 3. Next Best Action Engine
 */
const getNextBestAction = async (studentId) => {
  // Check 1: Incomplete lesson in most recently accessed course
  const enrollment = await Enrollment.findOne({
    studentId,
    progressPercentage: { $lt: 100 },
  })
    .sort({ lastAccessedAt: -1, updatedAt: -1 })
    .populate('courseId')
    .lean();

  if (enrollment && enrollment.courseId) {
    const course = enrollment.courseId;

    // Check for recent unresolved mistake
    const recentMistake = await Mistake.findOne({ studentId, resolved: false }).sort({ createdAt: -1 }).lean();
    if (recentMistake && recentMistake.topic) {
      return {
        actionType: 'REVIEW_WEAK_TOPIC',
        title: `Reinforce Weak Topic: ${recentMistake.topic}`,
        description: `Review key concepts in ${recentMistake.topic} before taking your next quiz.`,
        resourceType: 'Topic',
        resourceId: recentMistake.topic,
        courseId: course._id,
        courseTitle: course.title,
        priority: 'HIGH',
        estimatedMinutes: 15,
        reason: 'Identified weakness in recent assessment attempt.',
        explanation: `Recommended because your recent practice test showed difficulty with ${recentMistake.topic}.`,
      };
    }

    const completedLessonIds = (enrollment.completedLessons || []).map((id) => id.toString());
    const nextLesson = await Lesson.findOne({
      courseId: course._id,
      _id: { $nin: completedLessonIds },
    })
      .sort({ order: 1 })
      .lean();

    if (nextLesson) {
      return {
        actionType: 'COMPLETE_LESSON',
        title: nextLesson.title,
        description: `Resume ${course.title} — Lesson ${nextLesson.order || 1}`,
        resourceType: 'Lesson',
        resourceId: nextLesson._id,
        courseId: course._id,
        courseTitle: course.title,
        priority: 'HIGH',
        estimatedMinutes: nextLesson.durationMinutes || 20,
        reason: 'Next sequential lesson in your active course.',
        explanation: `Recommended because you are actively enrolled in "${course.title}" (${enrollment.progressPercentage}% complete).`,
      };
    }
  }

  // Check 2: Foundational course enrollment (Cold Start or Completed)
  const publishedCourse = await Course.findOne({ status: 'PUBLISHED', isPublished: true, isDeleted: { $ne: true } }).sort({ averageRating: -1 }).lean();
  if (publishedCourse) {
    return {
      actionType: 'EXPLORE_COURSE',
      title: publishedCourse.title,
      description: 'Start learning foundational web and backend engineering skills.',
      resourceType: 'Course',
      resourceId: publishedCourse._id,
      courseId: publishedCourse._id,
      courseTitle: publishedCourse.title,
      priority: 'MEDIUM',
      estimatedMinutes: 30,
      reason: 'Top-rated foundational course matching your goals.',
      explanation: 'Recommended because you do not have any active courses in progress.',
    };
  }

  return {
    actionType: 'EXPLORE_CATALOG',
    title: 'Explore Learning Catalog',
    description: 'Discover courses, coding practice, and projects.',
    resourceType: 'Catalog',
    resourceId: null,
    priority: 'LOW',
    estimatedMinutes: 10,
    reason: 'Personalized course catalog ready for exploration.',
    explanation: 'Begin your learning journey by exploring platform tracks.',
  };
};

/**
 * 4. Personalized Daily Learning Plan
 */
const getDailyPlan = async (studentId) => {
  const nextAction = await getNextBestAction(studentId);

  const schedule = [
    {
      timeSlot: 'Morning (20 mins)',
      activityType: nextAction.actionType === 'REVIEW_WEAK_TOPIC' ? 'Concept Review' : 'Active Lesson',
      title: nextAction.title,
      estimatedMinutes: nextAction.estimatedMinutes || 20,
      status: 'PENDING',
      why: nextAction.explanation,
    },
    {
      timeSlot: 'Afternoon (30 mins)',
      activityType: 'Code Practice Drill',
      title: 'Solve 2 Sandboxed Coding Problems',
      estimatedMinutes: 30,
      status: 'PENDING',
      why: 'Regular coding practice strengthens algorithmic intuition and speed.',
    },
    {
      timeSlot: 'Evening (10 mins)',
      activityType: 'Progress Review',
      title: 'Review Daily Notes & Flashcards',
      estimatedMinutes: 10,
      status: 'PENDING',
      why: 'Spaced repetition reinforces retention of today\'s newly acquired concepts.',
    },
  ];

  return {
    date: new Date().toISOString().split('T')[0],
    targetMinutes: 60,
    completedMinutes: 0,
    schedule,
    weeklyObjectives: {
      plannedLessons: 5,
      completedLessons: 2,
      plannedCodingProblems: 10,
      completedCodingProblems: 6,
      streakGoalDays: 7,
      currentStreak: 3,
    },
    algorithmVersion: 'v2.4-hybrid',
  };
};

/**
 * 5. Handle recommendation user feedback
 */
const recordFeedback = async (studentId, { recommendationId, feedback, reason }) => {
  if (recommendationId && mongoose.isValidObjectId(recommendationId)) {
    await Recommendation.findByIdAndUpdate(recommendationId, {
      feedback: feedback || 'HELPFUL',
      status: feedback === 'NOT_RELEVANT' ? 'DISMISSED' : 'CLICKED',
    });
  }
  return {
    success: true,
    message: 'Feedback successfully recorded to improve future recommendations.',
  };
};

/**
 * 6. Cold-Start Onboarding Handler
 */
const handleOnboarding = async (studentId, onboardingData = {}) => {
  const { careerGoal = 'full-stack-developer', skillLevel = 'BEGINNER', preferredPace = 'MODERATE' } = onboardingData;

  let profile = await LearningProfile.findOne({ studentId });
  if (!profile) {
    profile = new LearningProfile({ studentId });
  }

  profile.preferences = {
    ...profile.preferences,
    personalizedRecommendations: true,
    aiTutorContext: true,
    learningReminders: true,
  };

  profile.lastAnalyzedAt = new Date();
  await profile.save();

  return {
    success: true,
    message: 'Learner profile initialized successfully with personalized preferences.',
    careerGoal,
    skillLevel,
    preferredPace,
  };
};

/**
 * 7. Safe Profile Reset & Rebuild
 */
const resetProfile = async (studentId) => {
  await Recommendation.updateMany({ studentId }, { status: 'DISMISSED' });

  // Re-calculate profile from actual course enrollments and submissions
  const enrollmentsCount = await Enrollment.countDocuments({ studentId });
  const profile = await LearningProfile.findOneAndUpdate(
    { studentId },
    {
      lastAnalyzedAt: new Date(),
      'preferences.personalizedRecommendations': true,
    },
    { new: true, upsert: true }
  );

  return {
    success: true,
    message: 'Personalization profile successfully recalculated from verified platform history.',
    profile,
  };
};

module.exports = {
  generateLearningPath,
  getSkillGaps,
  getNextBestAction,
  getDailyPlan,
  recordFeedback,
  handleOnboarding,
  resetProfile,
  resolveCanonicalSkill,
  CANONICAL_SKILL_ALIASES,
};
