const Resume = require('../../models/resume.model');
const Job = require('../../models/job.model');
const CareerPath = require('../../models/careerPath.model');

class ResumeService {
  async getStudentResumes(studentId) {
    return Resume.find({ studentId })
      .select('title template version personalInfo.fullName updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();
  }

  async getResumeById(resumeId, studentId) {
    const resume = await Resume.findOne({ _id: resumeId, studentId }).lean();
    if (!resume) {
      const error = new Error('Resume not found or access denied');
      error.statusCode = 404;
      throw error;
    }
    return resume;
  }

  async createResume(studentId, resumeData) {
    const {
      title = 'My Technical Resume',
      template = 'MODERN',
      personalInfo = {},
      summary = '',
      education = [],
      experience = [],
      skills = [],
      projects = [],
      certifications = [],
      achievements = [],
      links = [],
    } = resumeData;

    const resume = await Resume.create({
      studentId,
      title,
      template,
      personalInfo,
      summary,
      education,
      experience,
      skills,
      projects,
      certifications,
      achievements,
      links,
      version: 1,
      versionHistory: [],
    });

    return resume;
  }

  async updateResume(resumeId, studentId, updateData) {
    const existing = await Resume.findOne({ _id: resumeId, studentId });
    if (!existing) {
      const error = new Error('Resume not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    // Save previous version in version history
    const previousSnapshot = {
      title: existing.title,
      template: existing.template,
      personalInfo: existing.personalInfo,
      summary: existing.summary,
      education: existing.education,
      experience: existing.experience,
      skills: existing.skills,
      projects: existing.projects,
      certifications: existing.certifications,
      achievements: existing.achievements,
      links: existing.links,
    };

    const newVersion = (existing.version || 1) + 1;
    existing.versionHistory.push({
      versionNumber: existing.version,
      snapshot: previousSnapshot,
      savedAt: new Date(),
    });

    // Update with new data
    Object.assign(existing, updateData);
    existing.version = newVersion;

    await existing.save();
    return existing;
  }

  async restoreVersion(resumeId, studentId, targetVersion) {
    const existing = await Resume.findOne({ _id: resumeId, studentId });
    if (!existing) {
      const error = new Error('Resume not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const historical = existing.versionHistory.find((v) => v.versionNumber === targetVersion);
    if (!historical || !historical.snapshot) {
      const error = new Error(`Version ${targetVersion} not found in history`);
      error.statusCode = 404;
      throw error;
    }

    Object.assign(existing, historical.snapshot);
    existing.version = (existing.version || 1) + 1;

    await existing.save();
    return existing;
  }

  async deleteResume(resumeId, studentId) {
    const deleted = await Resume.findOneAndDelete({ _id: resumeId, studentId });
    if (!deleted) {
      const error = new Error('Resume not found or access denied');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, message: 'Resume deleted successfully' };
  }

  async analyzeResume(resumeId, studentId, { targetRole = 'Full Stack Developer', jobId = null } = {}) {
    const resume = await this.getResumeById(resumeId, studentId);

    const strengths = [];
    const missingInformation = [];
    const suggestions = [];
    const keywordAnalysis = { matched: [], missing: [] };

    // 1. Structural Checks
    if (!resume.personalInfo || !resume.personalInfo.fullName || !resume.personalInfo.email) {
      missingInformation.push('Contact information is missing full name or email address.');
    } else {
      strengths.push('Contact information is present and accessible.');
    }

    if (!resume.summary || resume.summary.length < 50) {
      suggestions.push('Add a concise 2-3 sentence technical summary emphasizing core technologies and achievements.');
    } else {
      strengths.push('Professional summary establishes clear career positioning.');
    }

    if (!resume.skills || resume.skills.length === 0) {
      missingInformation.push('No technical skills listed. Add categorical skills (e.g. Languages, Frameworks, Databases).');
    } else {
      strengths.push(`Lists ${resume.skills.length} technical skills across your experience.`);
    }

    if (!resume.projects || resume.projects.length === 0) {
      missingInformation.push('No portfolio projects included. Technical recruiters look for 2-3 demonstrated codebases.');
    } else {
      strengths.push(`Showcases ${resume.projects.length} practical projects.`);
    }

    if (!resume.experience || resume.experience.length === 0) {
      suggestions.push('If you lack formal company experience, feature open-source contributions, platform capstone projects, or academic roles in the experience section.');
    }

    // 2. Keyword & Job alignment
    let expectedKeywords = ['JavaScript', 'React', 'Node.js', 'Git', 'REST APIs'];
    if (jobId) {
      const job = await Job.findById(jobId).lean();
      if (job && job.skills && job.skills.length > 0) {
        expectedKeywords = job.skills;
      }
    } else {
      const path = await CareerPath.findOne({ name: new RegExp(targetRole, 'i') }).lean();
      if (path && path.resumeKeywords && path.resumeKeywords.length > 0) {
        expectedKeywords = path.resumeKeywords;
      }
    }

    // Check keyword occurrences in resume text
    const resumeText = JSON.stringify(resume).toLowerCase();
    expectedKeywords.forEach((kw) => {
      if (resumeText.includes(kw.toLowerCase())) {
        keywordAnalysis.matched.push(kw);
      } else {
        keywordAnalysis.missing.push(kw);
      }
    });

    const completenessScore = Math.min(
      100,
      Math.round(
        (strengths.length * 20 +
          (keywordAnalysis.matched.length / Math.max(1, expectedKeywords.length)) * 40)
      )
    );

    return {
      resumeTitle: resume.title,
      version: resume.version,
      completenessScore,
      strengths,
      missingInformation,
      suggestions,
      keywordAnalysis,
      targetRole,
      disclaimer: 'Analysis is an automated structural evaluation against target keywords and does not guarantee interview shortlisting.',
    };
  }
}

module.exports = new ResumeService();
