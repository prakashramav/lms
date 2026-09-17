const { JobApplication, ALLOWED_STATUS_TRANSITIONS } = require('../../models/application.model');
const Job = require('../../models/job.model');
const Company = require('../../models/company.model');
const Resume = require('../../models/resume.model');
const CoverLetter = require('../../models/coverLetter.model');

class ApplicationService {
  async applyToJob(studentId, { jobId, resumeId = null, coverLetterId = null, notes = '', source = 'PLATFORM', externalApplication = false }) {
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.status !== 'PUBLISHED') {
      const error = new Error('This job listing is no longer accepting applications');
      error.statusCode = 400;
      throw error;
    }

    // Duplicate application check (Section 117)
    const existing = await JobApplication.findOne({ studentId, jobId });
    if (existing) {
      const error = new Error('Application already recorded for this job');
      error.statusCode = 400;
      throw error;
    }

    // Verify resume belongs to student if provided
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, studentId });
      if (!resume) {
        const error = new Error('Selected resume not found or does not belong to you');
        error.statusCode = 400;
        throw error;
      }
    }

    const application = await JobApplication.create({
      studentId,
      jobId,
      resumeId,
      coverLetterId,
      status: 'APPLIED',
      appliedAt: new Date(),
      lastUpdatedAt: new Date(),
      notes,
      source,
      externalApplication,
      timeline: [
        {
          status: 'APPLIED',
          timestamp: new Date(),
          note: externalApplication
            ? 'External application initiated by candidate'
            : 'Application submitted directly on platform',
        },
      ],
    });

    return application;
  }

  async getStudentApplications(studentId, query = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter = { studentId };

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .populate({
          path: 'jobId',
          populate: { path: 'companyId', select: 'name logo website industry' },
        })
        .populate('resumeId', 'title version')
        .sort({ lastUpdatedAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      JobApplication.countDocuments(filter),
    ]);

    // Pipeline counts
    const pipelineCounts = {
      SAVED: 0,
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    const allApps = await JobApplication.find({ studentId }).select('status').lean();
    allApps.forEach((a) => {
      if (pipelineCounts[a.status] !== undefined) {
        pipelineCounts[a.status]++;
      }
    });

    return {
      applications,
      pipelineCounts,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getApplicationById(applicationId, user) {
    const application = await JobApplication.findById(applicationId)
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'name logo website industry locations' },
      })
      .populate('resumeId')
      .populate('coverLetterId')
      .lean();

    if (!application) {
      const error = new Error('Application record not found');
      error.statusCode = 404;
      throw error;
    }

    // IDOR Protection: Student can only view their own
    if (user.role === 'STUDENT' && application.studentId.toString() !== user._id.toString()) {
      const error = new Error('Access denied: You do not have permission to view this application');
      error.statusCode = 403;
      throw error;
    }

    return application;
  }

  async updateApplicationStatus(applicationId, newStatus, user, note = '') {
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = application.status;

    // Student permission constraint: Student can only withdraw their application
    if (user.role === 'STUDENT') {
      if (application.studentId.toString() !== user._id.toString()) {
        const error = new Error('Access denied to update this application');
        error.statusCode = 403;
        throw error;
      }
      if (newStatus !== 'WITHDRAWN') {
        const error = new Error('Students can only update application status to WITHDRAWN');
        error.statusCode = 400;
        throw error;
      }
    }

    // State machine transition validation
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      const error = new Error(`Cannot transition application from ${currentStatus} to ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    application.status = newStatus;
    application.lastUpdatedAt = new Date();
    application.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${newStatus} by ${user.role.toLowerCase()}`,
    });

    await application.save();
    return application;
  }

  async updateStudentNotes(applicationId, studentId, notes) {
    const application = await JobApplication.findOne({ _id: applicationId, studentId });
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }

    application.notes = notes;
    application.lastUpdatedAt = new Date();
    await application.save();

    return application;
  }
}

module.exports = new ApplicationService();
