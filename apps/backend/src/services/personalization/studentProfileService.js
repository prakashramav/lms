const mongoose = require('mongoose');
const { LearningProfile } = require('../../models/learningProfile.model');
const { StudentSkill } = require('../../models/skill.model');
const { Enrollment } = require('../../models/enrollment.model');
const Mistake = require('../../models/mistake.model');
const { Goal } = require('../../models/goal.model');
const Resume = require('../../models/resume.model');
const Portfolio = require('../../models/portfolio.model');
const CareerProfile = require('../../models/careerProfile.model');

/**
 * Student Dynamic Learning Profile Aggregator
 * Phase 14 — Personalization Engine (Section 4)
 */
const getComprehensiveStudentProfile = async (studentId) => {
  const [
    learningProfile,
    studentSkills,
    enrollments,
    recentMistakes,
    activeGoals,
    resume,
    portfolio,
    careerProfile,
  ] = await Promise.all([
    LearningProfile.findOne({ studentId }).lean(),
    StudentSkill.find({ studentId }).populate('skillId').lean(),
    Enrollment.find({ studentId }).populate('courseId', 'title slug thumbnail category difficulty').lean(),
    Mistake.find({ studentId, resolved: false }).limit(10).lean(),
    Goal.find({ studentId, status: 'IN_PROGRESS' }).lean(),
    Resume.findOne({ studentId }).sort({ updatedAt: -1 }).lean(),
    Portfolio.findOne({ studentId }).lean(),
    CareerProfile.findOne({ studentId }).populate('targetCareerPathId').lean(),
  ]);

  // Derive weak and strong skills based on mastery and assessment performance
  const strongSkills = [];
  const weakSkills = [];
  const developingSkills = [];

  studentSkills.forEach((s) => {
    const skillName = s.skillId ? s.skillId.name : 'Unknown';
    const item = {
      name: skillName,
      masteryLevel: s.masteryLevel || 'NOT_STARTED',
      observedScore: s.observedScore || s.assessmentScoreAvg || 0,
      assessmentBasedLevel: s.assessmentBasedLevel || s.masteryLevel,
      selfReportedLevel: s.selfReportedLevel || 'NONE',
      aiEstimatedLevel: s.aiEstimatedLevel || 'NOT_STARTED',
      practiceCount: s.practiceCount || 0,
    };

    if (['ADVANCED', 'MASTERED'].includes(s.masteryLevel) || item.observedScore >= 80) {
      strongSkills.push(item);
    } else if (['NOT_STARTED', 'BEGINNER'].includes(s.masteryLevel) || item.observedScore < 60) {
      weakSkills.push(item);
    } else {
      developingSkills.push(item);
    }
  });

  const completedCourses = enrollments.filter((e) => e.progressPercentage === 100);
  const activeCourses = enrollments.filter((e) => e.progressPercentage < 100);

  return {
    studentId,
    learningVelocity: learningProfile ? learningProfile.learningVelocity || 'MODERATE' : 'MODERATE',
    currentStreak: learningProfile ? learningProfile.currentStreak || 0 : 0,
    longestStreak: learningProfile ? learningProfile.longestStreak || 0 : 0,
    strongSkills,
    weakSkills,
    developingSkills,
    completedCoursesCount: completedCourses.length,
    activeCoursesCount: activeCourses.length,
    activeCourses: activeCourses.map((e) => ({
      courseId: e.courseId ? e.courseId._id : null,
      title: e.courseId ? e.courseId.title : 'Course',
      slug: e.courseId ? e.courseId.slug : '',
      progressPercentage: e.progressPercentage || 0,
      lastAccessedAt: e.lastAccessedAt || e.updatedAt,
    })),
    unresolvedMistakesCount: recentMistakes.length,
    recentMistakeTopics: Array.from(new Set(recentMistakes.map((m) => m.topic).filter(Boolean))),
    activeGoalsCount: activeGoals.length,
    targetCareer: careerProfile && careerProfile.targetCareerPathId ? careerProfile.targetCareerPathId.title : 'Full Stack Developer',
    resumeCompleted: !!(resume && resume.contact && resume.contact.fullName),
    portfolioPublished: !!(portfolio && portfolio.visibility === 'PUBLIC'),
  };
};

module.exports = {
  getComprehensiveStudentProfile,
};
