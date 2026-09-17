const careerPathService = require('../services/career/careerPath.service');
const careerPlanService = require('../services/career/careerPlan.service');
const jobService = require('../services/career/job.service');
const applicationService = require('../services/career/application.service');
const resumeService = require('../services/career/resume.service');
const portfolioService = require('../services/career/portfolio.service');
const interviewService = require('../services/career/interview.service');
const careerAiService = require('../services/career/careerAi.service');
const careerAnalyticsService = require('../services/career/careerAnalytics.service');
const CareerResource = require('../models/careerResource.model');
const JobReport = require('../models/jobReport.model');
const Company = require('../models/company.model');
const Job = require('../models/job.model');
const CareerPath = require('../models/careerPath.model');
const { JobApplication } = require('../models/application.model');

class CareerController {
  // ================= CAREER PATHS =================
  async getCareerPaths(req, res, next) {
    try {
      const paths = await careerPathService.getCareerPaths(req.query);
      res.json({ success: true, data: paths });
    } catch (err) {
      next(err);
    }
  }

  async getCareerPathBySlug(req, res, next) {
    try {
      const path = await careerPathService.getCareerPathBySlug(req.params.slug);
      res.json({ success: true, data: path });
    } catch (err) {
      next(err);
    }
  }

  async getCareerRoadmap(req, res, next) {
    try {
      const roadmap = await careerPathService.getCareerRoadmap(req.params.careerPathId);
      res.json({ success: true, data: roadmap });
    } catch (err) {
      next(err);
    }
  }

  async getCareerResources(req, res, next) {
    try {
      const { category } = req.query;
      const filter = { status: 'PUBLISHED' };
      if (category && category !== 'ALL') filter.category = category.toUpperCase();
      const resources = await CareerResource.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: resources });
    } catch (err) {
      next(err);
    }
  }

  // ================= STUDENT CAREER & SKILLS =================
  async getStudentCareerProfile(req, res, next) {
    try {
      const profile = await careerPathService.getOrCreateCareerProfile(req.user._id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateTargetCareer(req, res, next) {
    try {
      const { careerPathId } = req.body;
      const profile = await careerPathService.updateTargetCareer(req.user._id, careerPathId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getStudentSkillGaps(req, res, next) {
    try {
      const { careerPathId } = req.query;
      const gaps = await careerPathService.calculateSkillGaps(req.user._id, careerPathId);
      res.json({ success: true, data: gaps });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCareerPlan(req, res, next) {
    try {
      const plan = await careerPlanService.getStudentCareerPlan(req.user._id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async updateCareerPlan(req, res, next) {
    try {
      const plan = await careerPlanService.updateCareerPlan(req.user._id, req.body);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async toggleMilestone(req, res, next) {
    try {
      const { milestoneIndex, completed } = req.body;
      const plan = await careerPlanService.toggleMilestone(req.user._id, milestoneIndex, completed);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCareerAnalytics(req, res, next) {
    try {
      const analytics = await careerAnalyticsService.getStudentCareerAnalytics(req.user._id);
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }

  // ================= JOBS =================
  async searchJobs(req, res, next) {
    try {
      const studentId = req.user ? req.user._id : null;
      const result = await jobService.searchJobs(req.query, studentId);
      res.json({ success: true, data: result.jobs, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req, res, next) {
    try {
      const studentId = req.user ? req.user._id : null;
      const job = await jobService.getJobById(req.params.jobId, studentId);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  async saveJob(req, res, next) {
    try {
      const result = await jobService.saveJob(req.user._id, req.params.jobId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      const result = await jobService.unsaveJob(req.user._id, req.params.jobId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSavedJobs(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await jobService.getSavedJobs(req.user._id, page, limit);
      res.json({ success: true, data: result.jobs, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async reportJob(req, res, next) {
    try {
      const result = await jobService.reportJob(req.params.jobId, req.user._id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ================= APPLICATIONS =================
  async applyToJob(req, res, next) {
    try {
      const application = await applicationService.applyToJob(req.user._id, req.body);
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  async getStudentApplications(req, res, next) {
    try {
      const result = await applicationService.getStudentApplications(req.user._id, req.query);
      res.json({ success: true, applications: result.applications, data: result.applications, pipelineCounts: result.pipelineCounts, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }


  async getApplicationById(req, res, next) {
    try {
      const application = await applicationService.getApplicationById(req.params.applicationId, req.user);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { status, note } = req.body;
      const application = await applicationService.updateApplicationStatus(req.params.applicationId, status, req.user, note);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  async updateStudentNotes(req, res, next) {
    try {
      const { notes } = req.body;
      const application = await applicationService.updateStudentNotes(req.params.applicationId, req.user._id, notes);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  // ================= RESUMES =================
  async getStudentResumes(req, res, next) {
    try {
      const resumes = await resumeService.getStudentResumes(req.user._id);
      res.json({ success: true, data: resumes });
    } catch (err) {
      next(err);
    }
  }

  async getResumeById(req, res, next) {
    try {
      const resume = await resumeService.getResumeById(req.params.resumeId, req.user._id);
      res.json({ success: true, data: resume });
    } catch (err) {
      next(err);
    }
  }

  async createResume(req, res, next) {
    try {
      const resume = await resumeService.createResume(req.user._id, req.body);
      res.status(201).json({ success: true, data: resume });
    } catch (err) {
      next(err);
    }
  }

  async updateResume(req, res, next) {
    try {
      const resume = await resumeService.updateResume(req.params.resumeId, req.user._id, req.body);
      res.json({ success: true, data: resume });
    } catch (err) {
      next(err);
    }
  }

  async restoreResumeVersion(req, res, next) {
    try {
      const { version } = req.body;
      const resume = await resumeService.restoreVersion(req.params.resumeId, req.user._id, version);
      res.json({ success: true, data: resume });
    } catch (err) {
      next(err);
    }
  }

  async deleteResume(req, res, next) {
    try {
      const result = await resumeService.deleteResume(req.params.resumeId, req.user._id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async analyzeResume(req, res, next) {
    try {
      const analysis = await resumeService.analyzeResume(req.params.resumeId, req.user._id, req.body);
      res.json({ success: true, data: analysis });
    } catch (err) {
      next(err);
    }
  }

  // ================= PORTFOLIO =================
  async getStudentPortfolio(req, res, next) {
    try {
      const portfolio = await portfolioService.getStudentPortfolio(req.user._id);
      res.json({ success: true, data: portfolio });
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolio(req, res, next) {
    try {
      const portfolio = await portfolioService.updatePortfolio(req.user._id, req.body);
      res.json({ success: true, data: portfolio });
    } catch (err) {
      next(err);
    }
  }

  async getPublicPortfolio(req, res, next) {
    try {
      const requestingUserId = req.user ? req.user._id : null;
      const portfolio = await portfolioService.getPublicPortfolio(req.params.username, requestingUserId);
      res.json({ success: true, data: portfolio });
    } catch (err) {
      next(err);
    }
  }

  // ================= INTERVIEW =================
  async getInterviewQuestions(req, res, next) {
    try {
      const result = await interviewService.getInterviewQuestions(req.query);
      res.json({ success: true, data: result.questions, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async startMockInterviewSession(req, res, next) {
    try {
      const session = await interviewService.startMockInterviewSession(req.user._id, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async submitSessionAnswer(req, res, next) {
    try {
      const session = await interviewService.submitSessionAnswer(req.params.sessionId, req.user._id, req.body);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async getInterviewSession(req, res, next) {
    try {
      const session = await interviewService.getSessionById(req.params.sessionId, req.user._id);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async getStudentSessionHistory(req, res, next) {
    try {
      const history = await interviewService.getStudentSessionHistory(req.user._id);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  // ================= AI CAREER =================
  async chatWithCareerAssistant(req, res, next) {
    try {
      const response = await careerAiService.chatWithCareerAssistant(req.user._id, req.body);
      res.json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  }

  async analyzeResumeAgainstJob(req, res, next) {
    try {
      const analysis = await careerAiService.analyzeResumeAgainstJob(req.user._id, req.body);
      res.json({ success: true, data: analysis });
    } catch (err) {
      next(err);
    }
  }

  async evaluateInterviewAnswer(req, res, next) {
    try {
      const feedback = await careerAiService.evaluateInterviewAnswer(req.body);
      res.json({ success: true, data: feedback });
    } catch (err) {
      next(err);
    }
  }

  // ================= ADMIN CAREER =================
  async getAdminPlacementAnalytics(req, res, next) {
    try {
      const analytics = await careerAnalyticsService.getAdminPlacementAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }

  async adminUpdateJobStatus(req, res, next) {
    try {
      const job = await jobService.updateJobStatus(req.params.jobId, req.body.status, req.user);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  async getJobReports(req, res, next) {
    try {
      const reports = await JobReport.find()
        .populate('jobId', 'title companyId')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      res.json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  async adminReviewJobReport(req, res, next) {
    try {
      const { status } = req.body;
      const report = await JobReport.findByIdAndUpdate(
        req.params.reportId,
        {
          $set: {
            status,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
          },
        },
        { new: true }
      );
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async createCareerPath(req, res, next) {
    try {
      const path = await CareerPath.create(req.body);
      res.status(201).json({ success: true, data: path });
    } catch (err) {
      next(err);
    }
  }

  async updateCareerPath(req, res, next) {
    try {
      const path = await CareerPath.findByIdAndUpdate(req.params.careerPathId, { $set: req.body }, { new: true });
      res.json({ success: true, data: path });
    } catch (err) {
      next(err);
    }
  }

  // ================= EMPLOYER =================
  async getEmployerCompany(req, res, next) {
    try {
      const company = await Company.findOne({ employerUserIds: req.user._id }).lean();
      res.json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  async updateEmployerCompany(req, res, next) {
    try {
      let company = await Company.findOne({ employerUserIds: req.user._id });
      if (!company) {
        company = await Company.create({
          ...req.body,
          employerUserIds: [req.user._id],
        });
      } else {
        Object.assign(company, req.body);
        await company.save();
      }
      res.json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  async createEmployerJob(req, res, next) {
    try {
      let company = await Company.findOne({ employerUserIds: req.user._id });
      if (!company) {
        const error = new Error('Please create a company profile before posting jobs');
        error.statusCode = 400;
        throw error;
      }
      const job = await jobService.createJob({ ...req.body, companyId: company._id }, req.user._id, req.user.role);
      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  async getJobApplicationsForEmployer(req, res, next) {
    try {
      const company = await Company.findOne({ employerUserIds: req.user._id });
      if (!company) {
        return res.json({ success: true, data: [] });
      }
      const jobs = await Job.find({ companyId: company._id }).select('_id');
      const jobIds = jobs.map((j) => j._id);

      const applications = await JobApplication.find({ jobId: { $in: jobIds } })
        .populate('studentId', 'name email avatar')
        .populate('jobId', 'title')
        .populate('resumeId')
        .sort({ appliedAt: -1 })
        .lean();

      res.json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  }

  async employerUpdateApplicationStatus(req, res, next) {
    try {
      const { status, note } = req.body;
      const application = await applicationService.updateApplicationStatus(req.params.applicationId, status, req.user, note);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CareerController();
