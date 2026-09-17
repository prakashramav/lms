const mongoose = require('mongoose');
const { JobApplication } = require('../../models/application.model');
const Job = require('../../models/job.model');
const { User } = require('../../models/user.model');
const AuditLog = require('../../models/auditLog.model');

/**
 * Employer ATS Pipeline & Candidate Intelligence
 * Phase 14 — Employer Intelligence (Sections 54 - 60)
 */

const ATS_STAGES = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'ASSESSMENT',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

/**
 * Updates application pipeline stage with audit trail
 */
const updateApplicationStage = async ({ applicationId, newStage, actorId, note = '' }) => {
  if (!ATS_STAGES.includes(newStage)) {
    throw new Error(`Invalid ATS stage: ${newStage}`);
  }

  const application = await JobApplication.findById(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  const previousStage = application.status;
  application.status = newStage;
  application.lastUpdatedAt = new Date();
  application.timeline.push({
    status: newStage,
    timestamp: new Date(),
    note: note || `Stage updated from ${previousStage} to ${newStage}`,
  });

  await application.save();

  // Audit the stage change
  await AuditLog.create({
    actorId,
    actorRole: 'EMPLOYER',
    action: 'ATS_STAGE_UPDATE',
    resourceType: 'APPLICATION',
    resourceId: application._id,
    metadata: {
      jobId: application.jobId,
      studentId: application.studentId,
      previousStage,
      newStage,
      note,
    },
  });

  return application;
};

/**
 * Fetches Kanban-organized pipeline counts and applicants for a company/job
 */
const getPipelineBoard = async (employerId, jobId = null) => {
  const query = {};
  if (jobId) {
    query.jobId = jobId;
  }

  const applications = await JobApplication.find(query)
    .populate('studentId', 'name email avatar')
    .populate('jobId', 'title companyId location')
    .populate('resumeId')
    .sort({ lastUpdatedAt: -1 })
    .lean();

  const board = {};
  ATS_STAGES.forEach((stage) => {
    board[stage] = [];
  });

  applications.forEach((app) => {
    const stage = ATS_STAGES.includes(app.status) ? app.status : 'APPLIED';
    board[stage].push({
      _id: app._id,
      student: app.studentId,
      job: app.jobId,
      appliedAt: app.appliedAt,
      lastUpdatedAt: app.lastUpdatedAt,
      status: app.status,
    });
  });

  return {
    stages: ATS_STAGES,
    board,
    totalApplicants: applications.length,
  };
};

module.exports = {
  updateApplicationStage,
  getPipelineBoard,
  ATS_STAGES,
};
