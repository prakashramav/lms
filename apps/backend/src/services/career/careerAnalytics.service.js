const { JobApplication } = require('../../models/application.model');
const Job = require('../../models/job.model');
const Company = require('../../models/company.model');
const SavedJob = require('../../models/savedJob.model');
const Resume = require('../../models/resume.model');
const Portfolio = require('../../models/portfolio.model');
const InterviewSession = require('../../models/interviewSession.model');
const CareerProfile = require('../../models/careerProfile.model');
const CareerPath = require('../../models/careerPath.model');
const CareerPlan = require('../../models/careerPlan.model');

class CareerAnalyticsService {
  async getStudentCareerAnalytics(studentId) {
    const [
      applications,
      savedCount,
      resumesCount,
      portfolio,
      sessions,
      plan,
      profile,
    ] = await Promise.all([
      JobApplication.find({ studentId }).select('status appliedAt').lean(),
      SavedJob.countDocuments({ studentId }),
      Resume.countDocuments({ studentId }),
      Portfolio.findOne({ studentId }).select('projects visibility').lean(),
      InterviewSession.find({ studentId, status: 'COMPLETED' }).select('overallScore duration').lean(),
      CareerPlan.findOne({ studentId }).lean(),
      CareerProfile.findOne({ studentId }).lean(),
    ]);

    const pipelineBreakdown = {
      SAVED: savedCount,
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    applications.forEach((a) => {
      if (pipelineBreakdown[a.status] !== undefined) {
        pipelineBreakdown[a.status]++;
      }
    });

    const avgInterviewScore = sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / sessions.length)
      : 0;

    return {
      pipelineBreakdown,
      totalApplications: applications.length,
      savedJobs: savedCount,
      resumesCreated: resumesCount,
      showcaseProjectsCount: portfolio?.projects?.length || 0,
      portfolioVisibility: portfolio?.visibility || 'NOT_CREATED',
      mockInterviewsCompleted: sessions.length,
      averageInterviewScore: avgInterviewScore,
      planMilestonesCompleted: plan?.milestones?.filter((m) => m.completed).length || 0,
      planTotalMilestones: plan?.milestones?.length || 0,
      readinessScore: profile?.readinessScore || 0,
      targetRole: profile?.targetRole || 'Full Stack Developer',
    };
  }

  async getInstructorCareerAnalytics(instructorId) {
    const [pathCounts, totalInterviews] = await Promise.all([
      CareerProfile.aggregate([
        { $group: { _id: '$targetRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      InterviewSession.countDocuments({ status: 'COMPLETED' }),
    ]);

    return {
      topCareerInterests: pathCounts.map((p) => ({ role: p._id || 'General', count: p.count })),
      totalInterviewsCompleted: totalInterviews,
    };
  }

  async getAdminPlacementAnalytics() {
    const [
      totalJobs,
      publishedJobs,
      totalCompanies,
      totalApplications,
      totalInterviews,
      appStatusCounts,
      skillAggregation,
    ] = await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Company.countDocuments({ status: 'VERIFIED' }),
      JobApplication.countDocuments({}),
      InterviewSession.countDocuments({ status: 'COMPLETED' }),
      JobApplication.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { status: 'PUBLISHED' } },
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const pipeline = {
      SAVED: 0,
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    appStatusCounts.forEach((s) => {
      if (pipeline[s._id] !== undefined) {
        pipeline[s._id] = s.count;
      }
    });

    const topSkillsInDemand = skillAggregation.map((s) => ({
      skill: s._id,
      count: s.count,
    }));

    return {
      totalJobs,
      publishedJobs,
      totalCompanies,
      totalApplications,
      totalInterviews,
      pipeline,
      topSkillsInDemand,
    };
  }
}

module.exports = new CareerAnalyticsService();
