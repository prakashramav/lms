const Job = require('../../models/job.model');
const Company = require('../../models/company.model');
const SavedJob = require('../../models/savedJob.model');
const { JobApplication } = require('../../models/application.model');
const JobReport = require('../../models/jobReport.model');
const { StudentSkill } = require('../../models/skill.model');

class JobService {
  async searchJobs(queryParams = {}, studentId = null) {
    const {
      keyword,
      skills,
      remoteType,
      employmentType,
      experienceLevel,
      location,
      companyId,
      sortBy = 'postedAt',
      page = 1,
      limit = 12,
    } = queryParams;

    const filter = { status: 'PUBLISHED' };

    // Keyword search (title or description or skills)
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { skills: regex },
        { location: regex },
      ];
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        filter.skills = { $in: skillsArray.map((s) => new RegExp(`^${s}$`, 'i')) };
      }
    }

    if (remoteType && remoteType !== 'ALL') {
      filter.remoteType = remoteType.toUpperCase();
    }

    if (employmentType && employmentType !== 'ALL') {
      filter.employmentType = employmentType.toUpperCase();
    }

    if (experienceLevel && experienceLevel !== 'ALL') {
      filter.experienceLevel = experienceLevel.toUpperCase();
    }

    if (location && location.trim()) {
      filter.location = new RegExp(location.trim(), 'i');
    }

    if (companyId) {
      filter.companyId = companyId;
    }

    // Sorting
    let sortOption = { postedAt: -1 };
    if (sortBy === 'salary') {
      sortOption = { 'salaryRange.max': -1, postedAt: -1 };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [jobs, totalCount] = await Promise.all([
      Job.find(filter)
        .populate('companyId', 'name logo website industry size locations')
        .sort(sortOption)
        .skip(skip)
        .limit(take)
        .lean(),
      Job.countDocuments(filter),
    ]);

    // Enrich with student context (saved, applied, match signals)
    let savedJobIds = new Set();
    let appliedMap = new Map();
    let studentSkillNames = new Set();

    if (studentId) {
      const [savedList, appliedList, studentSkills] = await Promise.all([
        SavedJob.find({ studentId }).select('jobId').lean(),
        JobApplication.find({ studentId }).select('jobId status').lean(),
        StudentSkill.find({ studentId }).populate('skillId', 'name').lean(),
      ]);

      savedJobIds = new Set(savedList.map((s) => s.jobId.toString()));
      appliedList.forEach((a) => appliedMap.set(a.jobId.toString(), a.status));
      studentSkills.forEach((ss) => {
        if (ss.skillId && ss.skillId.name) {
          studentSkillNames.add(ss.skillId.name.toLowerCase());
        }
      });
    }

    const enrichedJobs = jobs.map((job) => {
      const jobIdStr = job._id.toString();
      const isSaved = savedJobIds.has(jobIdStr);
      const appliedStatus = appliedMap.get(jobIdStr) || null;

      // Matching signals
      const matchingSignals = [];
      const missingSkills = [];

      if (studentId && job.skills && job.skills.length > 0) {
        job.skills.forEach((reqSkill) => {
          if (studentSkillNames.has(reqSkill.toLowerCase())) {
            matchingSignals.push(`Matches your ${reqSkill} skill`);
          } else {
            missingSkills.push(reqSkill);
          }
        });

        if (job.remoteType === 'REMOTE') {
          matchingSignals.push('Matches remote work preference');
        }
      }

      const matchRatio = job.skills && job.skills.length > 0
        ? Math.round(((job.skills.length - missingSkills.length) / job.skills.length) * 100)
        : 70;

      return {
        ...job,
        isSaved,
        appliedStatus,
        matchingSignals: matchingSignals.slice(0, 3),
        missingSkills: missingSkills.slice(0, 4),
        matchScore: matchRatio,
      };
    });

    return {
      jobs: enrichedJobs,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async getJobById(jobId, studentId = null) {
    const job = await Job.findById(jobId)
      .populate('companyId', 'name logo website industry size locations description')
      .lean();

    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    let isSaved = false;
    let appliedStatus = null;
    const matchingSignals = [];
    const missingSkills = [];

    if (studentId) {
      const [saved, app, studentSkills] = await Promise.all([
        SavedJob.findOne({ studentId, jobId }),
        JobApplication.findOne({ studentId, jobId }).select('status'),
        StudentSkill.find({ studentId }).populate('skillId', 'name').lean(),
      ]);

      isSaved = !!saved;
      appliedStatus = app ? app.status : null;

      const studentSkillSet = new Set(
        studentSkills
          .filter((ss) => ss.skillId && ss.skillId.name)
          .map((ss) => ss.skillId.name.toLowerCase())
      );

      if (job.skills && job.skills.length > 0) {
        job.skills.forEach((reqSkill) => {
          if (studentSkillSet.has(reqSkill.toLowerCase())) {
            matchingSignals.push(`Matches your ${reqSkill} skill`);
          } else {
            missingSkills.push(reqSkill);
          }
        });
      }

      if (job.remoteType === 'REMOTE') {
        matchingSignals.push('Matches remote work preference');
      }
    }

    const matchRatio = job.skills && job.skills.length > 0
      ? Math.round(((job.skills.length - missingSkills.length) / job.skills.length) * 100)
      : 70;

    return {
      ...job,
      isSaved,
      appliedStatus,
      matchingSignals,
      missingSkills,
      matchScore: matchRatio,
    };
  }

  async saveJob(studentId, jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    await SavedJob.findOneAndUpdate(
      { studentId, jobId },
      { $setOnInsert: { studentId, jobId } },
      { upsert: true, new: true }
    );

    return { success: true, isSaved: true, message: 'Job saved to your bookmarks' };
  }

  async unsaveJob(studentId, jobId) {
    await SavedJob.findOneAndDelete({ studentId, jobId });
    return { success: true, isSaved: false, message: 'Job removed from your bookmarks' };
  }

  async getSavedJobs(studentId, page = 1, limit = 10) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [savedEntries, total] = await Promise.all([
      SavedJob.find({ studentId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate({
          path: 'jobId',
          populate: { path: 'companyId', select: 'name logo location industry' },
        })
        .lean(),
      SavedJob.countDocuments({ studentId }),
    ]);

    const jobs = savedEntries
      .filter((entry) => entry.jobId)
      .map((entry) => ({
        ...entry.jobId,
        savedAt: entry.createdAt,
        isSaved: true,
      }));

    return {
      jobs,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async reportJob(jobId, reportedBy, { reason, description }) {
    const job = await Job.findById(jobId);
    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    const report = await JobReport.create({
      jobId,
      reportedBy,
      reason,
      description: description || '',
    });

    return {
      success: true,
      message: 'Job report submitted for administrative review',
      reportId: report._id,
    };
  }

  async createJob(jobData, createdBy, userRole) {
    const status = userRole === 'ADMIN' ? 'PUBLISHED' : 'PENDING_REVIEW';
    const job = await Job.create({
      ...jobData,
      status,
      createdBy,
    });
    return job;
  }

  async updateJobStatus(jobId, status, user) {
    const validStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid job status: ${status}`);
      error.statusCode = 400;
      throw error;
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      { $set: { status } },
      { new: true }
    );

    if (!job) {
      const error = new Error('Job listing not found');
      error.statusCode = 404;
      throw error;
    }

    return job;
  }
}

module.exports = new JobService();
