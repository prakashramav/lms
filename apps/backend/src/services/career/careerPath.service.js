const CareerPath = require('../../models/careerPath.model');
const CareerProfile = require('../../models/careerProfile.model');
const { Skill, StudentSkill } = require('../../models/skill.model');
const { Enrollment } = require('../../models/enrollment.model');
const { StudentAchievement } = require('../../models/badge.model');
const Resume = require('../../models/resume.model');
const Portfolio = require('../../models/portfolio.model');
const InterviewSession = require('../../models/interviewSession.model');

class CareerPathService {
  async getCareerPaths(query = {}) {
    const filter = { status: 'PUBLISHED' };
    if (query.category) filter.category = query.category;
    if (query.difficulty) filter.difficulty = query.difficulty;

    return CareerPath.find(filter)
      .populate('requiredSkills', 'name slug category difficulty')
      .populate('recommendedCourses', 'title slug thumbnail level')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getCareerPathBySlug(slug) {
    const path = await CareerPath.findOne({ slug, status: { $ne: 'ARCHIVED' } })
      .populate('requiredSkills', 'name slug category difficulty description')
      .populate('recommendedCourses', 'title slug thumbnail level description')
      .lean();

    if (!path) {
      const error = new Error('Career path not found');
      error.statusCode = 404;
      throw error;
    }
    return path;
  }

  async getCareerPathById(id) {
    const path = await CareerPath.findById(id)
      .populate('requiredSkills', 'name slug category difficulty description')
      .populate('recommendedCourses', 'title slug thumbnail level description')
      .lean();

    if (!path) {
      const error = new Error('Career path not found');
      error.statusCode = 404;
      throw error;
    }
    return path;
  }

  async getOrCreateCareerProfile(studentId) {
    let profile = await CareerProfile.findOne({ studentId });
    if (!profile) {
      // Pick the default full-stack developer path if available
      const defaultPath = await CareerPath.findOne({ slug: 'full-stack-developer' });
      profile = await CareerProfile.create({
        studentId,
        careerPathId: defaultPath ? defaultPath._id : null,
        targetRole: defaultPath ? defaultPath.name : 'Full Stack Developer',
      });
    }

    // Refresh telemetry
    await this.refreshReadiness(profile);
    return CareerProfile.findById(profile._id)
      .populate({
        path: 'careerPathId',
        select: 'name slug category difficulty requiredSkills roadmapStages',
        populate: { path: 'requiredSkills', select: 'name slug category difficulty' },
      })
      .lean();
  }

  async updateTargetCareer(studentId, careerPathId) {
    const path = await CareerPath.findById(careerPathId);
    if (!path) {
      const error = new Error('Selected career path does not exist');
      error.statusCode = 404;
      throw error;
    }

    const profile = await CareerProfile.findOneAndUpdate(
      { studentId },
      {
        $set: {
          careerPathId: path._id,
          targetRole: path.name,
          lastCalculatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    await this.refreshReadiness(profile);
    return this.getOrCreateCareerProfile(studentId);
  }

  async refreshReadiness(profile) {
    const studentId = profile.studentId;

    // 1. Completed courses count
    const completedCourses = await Enrollment.countDocuments({
      studentId,
      status: 'COMPLETED',
    });

    // 2. Resume status
    const resumesCount = await Resume.countDocuments({ studentId });
    const resumeStatus = resumesCount > 0 ? 'COMPLETED' : 'NOT_STARTED';

    // 3. Portfolio status
    const portfolio = await Portfolio.findOne({ studentId });
    const portfolioStatus = portfolio && portfolio.projects && portfolio.projects.length > 0
      ? 'COMPLETED'
      : (portfolio ? 'IN_PROGRESS' : 'NOT_STARTED');

    // 4. Interview prep status
    const sessionsCount = await InterviewSession.countDocuments({
      studentId,
      status: 'COMPLETED',
    });
    const interviewPrepStatus = sessionsCount >= 3 ? 'PRACTICED' : (sessionsCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

    // 5. Skills calculation
    const studentSkills = await StudentSkill.find({ studentId }).populate('skillId').lean();
    const skillsList = studentSkills.map((s) => ({
      name: s.skillId ? s.skillId.name : 'General Skill',
      masteryLevel: s.masteryLevel,
      category: s.skillId ? s.skillId.category : 'GENERAL',
    }));

    // 6. Explainable readiness score (0 - 100)
    let skillsPoints = 0;
    if (studentSkills.length > 0) {
      const proficientCount = studentSkills.filter((s) => ['PROFICIENT', 'DEVELOPING', 'PRACTICING'].includes(s.masteryLevel)).length;
      skillsPoints = Math.min(30, Math.round((proficientCount / Math.max(5, studentSkills.length)) * 30));
    }

    const projectPoints = portfolio && portfolio.projects ? Math.min(25, portfolio.projects.length * 10) : 0;
    const resumePoints = resumeStatus === 'COMPLETED' ? 15 : 0;
    const portfolioPoints = portfolioStatus === 'COMPLETED' ? 15 : (portfolioStatus === 'IN_PROGRESS' ? 5 : 0);
    const interviewPoints = interviewPrepStatus === 'PRACTICED' ? 15 : (interviewPrepStatus === 'IN_PROGRESS' ? 8 : 0);

    const totalReadiness = Math.min(100, skillsPoints + projectPoints + resumePoints + portfolioPoints + interviewPoints);

    await CareerProfile.findByIdAndUpdate(profile._id, {
      $set: {
        completedCourses,
        resumeStatus,
        portfolioStatus,
        interviewPrepStatus,
        skills: skillsList,
        readinessScore: totalReadiness,
        readinessBreakdown: {
          skills: skillsPoints,
          projects: projectPoints,
          resume: resumePoints,
          portfolio: portfolioPoints,
          interview: interviewPoints,
        },
        lastCalculatedAt: new Date(),
      },
    });
  }

  async calculateSkillGaps(studentId, careerPathId = null) {
    let targetPath = null;
    if (careerPathId) {
      targetPath = await CareerPath.findById(careerPathId).populate('requiredSkills');
    } else {
      const profile = await CareerProfile.findOne({ studentId });
      if (profile && profile.careerPathId) {
        targetPath = await CareerPath.findById(profile.careerPathId).populate('requiredSkills');
      }
    }

    if (!targetPath) {
      targetPath = await CareerPath.findOne({ slug: 'full-stack-developer' }).populate('requiredSkills');
    }

    if (!targetPath) {
      return {
        careerPath: null,
        alreadyPracticing: [],
        needsPractice: [],
        notStarted: [],
        recommendedNext: null,
      };
    }

    // Get student's current skills
    const studentSkills = await StudentSkill.find({ studentId }).populate('skillId').lean();
    const studentSkillMap = new Map();
    studentSkills.forEach((s) => {
      if (s.skillId) {
        studentSkillMap.set(s.skillId.slug, s);
      }
    });

    const alreadyPracticing = [];
    const needsPractice = [];
    const notStarted = [];

    const requiredSkills = targetPath.requiredSkills || [];

    for (const skill of requiredSkills) {
      const studentSkill = studentSkillMap.get(skill.slug);
      if (!studentSkill) {
        notStarted.push({
          _id: skill._id,
          name: skill.name,
          slug: skill.slug,
          category: skill.category,
          difficulty: skill.difficulty,
          status: 'Not Started',
        });
      } else if (['PROFICIENT', 'DEVELOPING', 'PRACTICING'].includes(studentSkill.masteryLevel)) {
        alreadyPracticing.push({
          _id: skill._id,
          name: skill.name,
          slug: skill.slug,
          category: skill.category,
          masteryLevel: studentSkill.masteryLevel,
          status: 'Already Practicing',
        });
      } else {
        needsPractice.push({
          _id: skill._id,
          name: skill.name,
          slug: skill.slug,
          category: skill.category,
          masteryLevel: studentSkill.masteryLevel,
          status: 'Needs Practice',
        });
      }
    }

    // Determine Recommended Next skill
    const recommendedNext = needsPractice.length > 0
      ? needsPractice[0]
      : (notStarted.length > 0 ? notStarted[0] : null);

    return {
      careerPath: {
        _id: targetPath._id,
        name: targetPath.name,
        slug: targetPath.slug,
        category: targetPath.category,
        difficulty: targetPath.difficulty,
      },
      alreadyPracticing,
      needsPractice,
      notStarted,
      recommendedNext,
      totalRequired: requiredSkills.length,
      completionPercentage: requiredSkills.length > 0
        ? Math.round((alreadyPracticing.length / requiredSkills.length) * 100)
        : 0,
    };
  }

  async getCareerRoadmap(careerPathId) {
    let path = null;
    if (careerPathId) {
      path = await CareerPath.findById(careerPathId).lean();
    }
    if (!path) {
      path = await CareerPath.findOne({ slug: 'full-stack-developer' }).lean();
    }
    if (!path) {
      const error = new Error('Career roadmap path not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      pathName: path.name,
      slug: path.slug,
      description: path.description,
      stages: path.roadmapStages && path.roadmapStages.length > 0
        ? path.roadmapStages
        : [
            { stageNumber: 1, title: 'Foundations', description: 'Core programming and computational thinking.', skills: ['Core Logic'] },
            { stageNumber: 2, title: 'Core Stack', description: 'Primary language and framework mastery.', skills: ['Frameworks'] },
            { stageNumber: 3, title: 'Capstone & Projects', description: 'Building and showcasing real-world apps.', skills: ['Projects'] },
            { stageNumber: 4, title: 'Interview Preparation', description: 'Technical, coding, and behavioral mastery.', skills: ['Interviews'] },
          ],
    };
  }
}

module.exports = new CareerPathService();
