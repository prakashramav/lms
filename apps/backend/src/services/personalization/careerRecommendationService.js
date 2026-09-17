const mongoose = require('mongoose');
const CareerPath = require('../../models/careerPath.model');
const { StudentSkill } = require('../../models/skill.model');
const CareerProfile = require('../../models/careerProfile.model');

/**
 * Career Recommendation & Skill Gap Engine
 * Phase 14 — Personalization Engine (Sections 39 - 44)
 */

/**
 * Computes deep skill gap analysis for a given career path
 */
const getCareerSkillGap = async (studentId, careerPathSlug = 'full-stack-developer') => {
  let careerPath = await CareerPath.findOne({ slug: careerPathSlug }).populate('requiredSkills').lean();
  if (!careerPath) {
    careerPath = await CareerPath.findOne().populate('requiredSkills').lean();
  }
  const studentSkills = await StudentSkill.find({ studentId }).populate('skillId').lean();

  if (!careerPath) {
    return {
      error: 'Career path not found',
      careerPathTitle: 'Full Stack Developer',
      matchedSkills: [],
      missingSkills: [],
      matchPercentage: 0,
      roadmapPhases: [],
    };
  }

  // Extract student mastered / developing skills
  const studentSkillNames = new Set(
    studentSkills
      .filter((s) => s.skillId && ['INTERMEDIATE', 'ADVANCED', 'MASTERED'].includes(s.masteryLevel))
      .map((s) => s.skillId.name.toLowerCase())
  );

  const matchedSkills = [];
  const missingSkills = [];

  (careerPath.requiredSkills || []).forEach((req) => {
    const skillName = typeof req === 'object' && req && req.name ? req.name : req ? req.toString() : '';
    if (!skillName) return;
    const isMatched = studentSkillNames.has(skillName.toLowerCase());
    if (isMatched) {
      matchedSkills.push(skillName);
    } else {
      missingSkills.push({
        name: skillName,
        importance: (req && req.importance) || 'REQUIRED',
        recommendedCourseCategory: skillName.toLowerCase().includes('database') ? 'DATABASE' : 'FRONTEND',
      });
    }
  });

  const totalReq = (careerPath.requiredSkills || []).length;
  const matchPercentage = totalReq > 0 ? Math.round((matchedSkills.length / totalReq) * 100) : 65;

  const roadmapPhases = [
    {
      phaseNumber: 1,
      title: 'Phase 1: Foundation',
      status: matchPercentage >= 30 ? 'COMPLETED' : 'IN_PROGRESS',
      description: 'Master core languages and programming paradigms.',
      items: ['HTML5 & CSS3', 'JavaScript Fundamentals', 'Git Version Control'],
    },
    {
      phaseNumber: 2,
      title: 'Phase 2: Core Skills',
      status: matchPercentage >= 60 ? 'COMPLETED' : matchPercentage >= 30 ? 'IN_PROGRESS' : 'RECOMMENDED',
      description: 'Build production-ready applications with modern frameworks.',
      items: ['React Component Architecture', 'Node.js & Express REST APIs', 'MongoDB Data Modeling'],
    },
    {
      phaseNumber: 3,
      title: 'Phase 3: Projects & Portfolio',
      status: matchPercentage >= 80 ? 'COMPLETED' : matchPercentage >= 60 ? 'IN_PROGRESS' : 'RECOMMENDED',
      description: 'Demonstrate applied expertise with end-to-end full stack projects.',
      items: ['Full Stack LMS or E-Commerce App', 'Real-time Chat / Collaboration Tool', 'Live Portfolio Deployment'],
    },
    {
      phaseNumber: 4,
      title: 'Phase 4: Interview Preparation',
      status: matchPercentage >= 80 ? 'IN_PROGRESS' : 'RECOMMENDED',
      description: 'Prepare for technical and behavioral interviews with AI Mock sessions.',
      items: ['Data Structures & Algorithms practice', 'System Design fundamentals', 'Mock behavioral interview feedback'],
    },
    {
      phaseNumber: 5,
      title: 'Phase 5: Job Applications',
      status: 'RECOMMENDED',
      description: 'Tailor resume keywords and apply to matched hiring partners.',
      items: ['ATS Resume optimization', 'Apply to verified roles', 'Track application progress'],
    },
  ];

  const title = careerPath.name || careerPath.title || 'Full Stack Developer';

  return {
    careerPathId: careerPath._id,
    careerPathTitle: title,
    careerPathSlug: careerPath.slug,
    description: careerPath.description,
    matchPercentage,
    matchedSkills,
    missingSkills,
    roadmapPhases,
    explanation: `Match score calculated against ${totalReq} core competencies required for ${title}.`,
  };
};

module.exports = {
  getCareerSkillGap,
};
