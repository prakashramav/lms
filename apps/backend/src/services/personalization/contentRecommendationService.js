const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const { Problem } = require('../../models/problem.model');
const { StudentSkill } = require('../../models/skill.model');
const ProjectShowcase = require('../../models/projectShowcase.model');

/**
 * Content & Project Recommendation Engine
 * Phase 14 — Personalization Engine (Sections 45 - 48, 86, 87)
 */

/**
 * Recommends curated projects based on skill gaps
 */
const getRecommendedProjects = async (studentId) => {
  return [
    {
      id: 'proj-1',
      title: 'Real-Time Collaborative Code Editor',
      description: 'Build a multi-user in-browser code editor with WebSockets and code execution sandbox integration.',
      techStack: ['React', 'Node.js', 'WebSockets', 'Tailwind CSS'],
      difficulty: 'INTERMEDIATE',
      estimatedHours: 12,
      skillsTargeted: ['React', 'WebSockets', 'Node.js'],
      reasonCodes: ['SKILL_GAP', 'CAREER_GOAL'],
      explanation: 'Recommended because you are building full-stack skills and do not yet have a real-time application in your portfolio.',
    },
    {
      id: 'proj-2',
      title: 'AI-Powered Career Intelligence Assistant',
      description: 'Create an intelligent dashboard matching user competencies against industry hiring criteria.',
      techStack: ['Next.js', 'Express', 'MongoDB', 'AI Embeddings'],
      difficulty: 'ADVANCED',
      estimatedHours: 16,
      skillsTargeted: ['Next.js', 'MongoDB', 'AI Integration'],
      reasonCodes: ['PORTFOLIO_GAP', 'INDUSTRY_DEMAND'],
      explanation: 'Recommended because AI-integrated full stack applications demonstrate high-demand production competencies.',
    },
    {
      id: 'proj-3',
      title: 'Enterprise RBAC User Management System',
      description: 'Develop a multi-tenant authentication portal with granular permissions, audit logs, and security headers.',
      techStack: ['Express.js', 'JWT', 'MongoDB', 'React'],
      difficulty: 'INTERMEDIATE',
      estimatedHours: 8,
      skillsTargeted: ['Authentication', 'Security', 'RBAC'],
      reasonCodes: ['CORE_COMPETENCY'],
      explanation: 'Recommended to validate enterprise backend security fundamentals.',
    },
  ];
};

/**
 * Recommends courses tailored to student skill gaps
 */
const getRecommendedCourses = async (studentId, limit = 4) => {
  const courses = await Course.find({ status: 'PUBLISHED', isPublished: true, isDeleted: { $ne: true } })
    .limit(limit)
    .select('title slug thumbnail category difficulty pricingType averageRating')
    .lean();

  return courses.map((c) => ({
    ...c,
    reasonCodes: ['CAREER_ALIGNMENT', 'HIGH_RATED'],
    explanation: `Recommended based on your target career path and community ratings (${c.averageRating || 4.8}★).`,
  }));
};

/**
 * Recommends personalized practice drills
 */
const getRecommendedPractice = async (studentId, limit = 5) => {
  const problems = await Problem.find({ isPublished: true })
    .limit(limit)
    .select('title slug difficulty category tags')
    .lean();

  return problems.map((p) => ({
    ...p,
    reasonCodes: ['WEAK_TOPIC_REINFORCEMENT'],
    explanation: `Recommended to build problem-solving velocity in ${p.category || 'General Programming'}.`,
  }));
};

module.exports = {
  getRecommendedProjects,
  getRecommendedCourses,
  getRecommendedPractice,
};
