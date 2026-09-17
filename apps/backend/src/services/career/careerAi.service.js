const { getAIProvider } = require('../ai/providers');
const CareerPath = require('../../models/careerPath.model');
const CareerProfile = require('../../models/careerProfile.model');
const { StudentSkill } = require('../../models/skill.model');
const Job = require('../../models/job.model');
const Resume = require('../../models/resume.model');

class CareerAIService {
  async chatWithCareerAssistant(studentId, { message, conversationHistory = [] }) {
    // 1. Fetch authorized student career context
    const [profile, studentSkills] = await Promise.all([
      CareerProfile.findOne({ studentId }).populate('careerPathId', 'name slug category difficulty').lean(),
      StudentSkill.find({ studentId }).populate('skillId', 'name').lean(),
    ]);

    const targetRole = profile?.targetRole || profile?.careerPathId?.name || 'Full Stack Developer';
    const knownSkills = studentSkills
      .filter((s) => s.skillId?.name)
      .map((s) => `${s.skillId.name} (${s.masteryLevel})`)
      .join(', ') || 'Beginning Web Development';

    const systemPrompt = `You are an expert Career Advisor and Engineering Placement Mentor on the LMS platform.
Your student is preparing for a role as: ${targetRole}.
Their current verified platform skills are: ${knownSkills}.

CRITICAL SAFEGUARDS:
1. NEVER promise or guarantee a job, offer, salary, or interview selection.
2. Provide transparent, grounded, encouraging feedback based on real skills, projects, and interview preparation.
3. If recommending resources or topics, focus on skills they need to practice.
4. Keep answers crisp, structured, and actionable.`;

    const messages = [
      ...conversationHistory.map((m) => ({ role: m.role || 'user', content: m.content })),
      { role: 'user', content: message },
    ];

    try {
      const provider = getAIProvider();
      const response = await provider.generateResponse({ systemPrompt, messages });
      return {
        reply: response.content || response,
        targetRole,
      };
    } catch (err) {
      // Deterministic fallback if external provider fails
      return {
        reply: `### Career Advisory: ${targetRole}\n\nTo advance toward your goal as a **${targetRole}**, focus on:\n\n1. **Core Technical Depth:** Ensure your understanding of foundational concepts is strong.\n2. **Demonstrated Projects:** Build 2-3 production-grade projects highlighting state management, API design, and testing.\n3. **Interview Articulation:** Practice explaining your past code and architectural decisions using structured STAR responses.\n\n*What specific topic or interview question would you like to explore next?*`,
        targetRole,
      };
    }
  }

  async analyzeResumeAgainstJob(studentId, { resumeId, jobId }) {
    const [resume, job] = await Promise.all([
      Resume.findOne({ _id: resumeId, studentId }).lean(),
      Job.findById(jobId).populate('companyId', 'name').lean(),
    ]);

    if (!resume) {
      const error = new Error('Resume not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    const jobSkills = job.skills || [];
    const resumeText = JSON.stringify(resume).toLowerCase();

    const matchedSkills = [];
    const missingSkills = [];

    jobSkills.forEach((s) => {
      if (resumeText.includes(s.toLowerCase())) {
        matchedSkills.push(s);
      } else {
        missingSkills.push(s);
      }
    });

    const recommendations = [];
    if (missingSkills.length > 0) {
      recommendations.push(
        `If you possess experience with ${missingSkills.join(', ')}, ensure these are explicitly listed in your Skills or Project descriptions.`
      );
    }
    if (!resume.summary || resume.summary.length < 40) {
      recommendations.push('Tailor your professional summary to reference this role specifically.');
    }
    recommendations.push('Quantify your project outcomes (e.g. latency reduced, user load handled, test coverage attained).');

    return {
      jobTitle: job.title,
      companyName: job.companyId?.name || 'Company',
      matchedSkills,
      missingSkills,
      matchPercentage: jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 100,
      recommendations,
      safetyNotice: 'This analysis provides keyword alignment suggestions. Never fabricate skills or experience you do not have.',
    };
  }

  async evaluateInterviewAnswer({ question, expectedTopics = [], studentAnswer }) {
    const answerLower = (studentAnswer || '').toLowerCase();
    const covered = [];
    const missing = [];

    expectedTopics.forEach((t) => {
      if (answerLower.includes(t.toLowerCase())) {
        covered.push(t);
      } else {
        missing.push(t);
      }
    });

    const score = expectedTopics.length > 0
      ? Math.min(100, Math.max(30, Math.round((covered.length / expectedTopics.length) * 70) + 30))
      : 75;

    return {
      score,
      coveredTopics: covered,
      missingTopics: missing,
      feedback: missing.length > 0
        ? `Good foundation. To strengthen your answer, consider addressing: ${missing.join(', ')}.`
        : 'Comprehensive and well-structured answer addressing core technical requirements.',
    };
  }
}

module.exports = new CareerAIService();
