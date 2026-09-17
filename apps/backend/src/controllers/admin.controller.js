const adminUserService = require('../services/admin/admin.user.service');
const adminCourseService = require('../services/admin/admin.course.service');
const adminAnalyticsService = require('../services/admin/admin.analytics.service');
const adminHealthService = require('../services/admin/admin.health.service');
const adminAuditService = require('../services/admin/admin.audit.service');
const adminSuperService = require('../services/admin/admin.super.service');

// Overview & Health
exports.getOverview = async (req, res, next) => {
  try {
    const kpis = await adminAnalyticsService.getOverviewKPIs();
    res.status(200).json({
      success: true,
      data: {
        ...kpis,
        systemStatus: 'OPERATIONAL',
        activeSandboxes: 4,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSystemHealth = async (req, res, next) => {
  try {
    const health = await adminHealthService.getSystemHealth();
    res.status(200).json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
};

// Analytics
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getOverviewKPIs();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getUserAnalytics();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getCourseAnalytics();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getLearningAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getLearningAnalytics();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAiMonitoring = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getAiMonitoring();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Users
exports.getUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.getUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await adminUserService.getUserById(req.params.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const updated = await adminUserService.updateUserStatus(
      req.params.userId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: `User status updated to ${req.body.status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const result = await adminUserService.getStudents(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getStudentDetail = async (req, res, next) => {
  try {
    const result = await adminUserService.getStudentDetail(req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getInstructors = async (req, res, next) => {
  try {
    const result = await adminUserService.getInstructors(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getInstructorDetail = async (req, res, next) => {
  try {
    const result = await adminUserService.getInstructorDetail(req.params.instructorId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.approveInstructor = async (req, res, next) => {
  try {
    const instructor = await adminUserService.approveInstructor(
      req.params.instructorId,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Instructor application approved successfully',
      data: instructor,
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectInstructor = async (req, res, next) => {
  try {
    const instructor = await adminUserService.rejectInstructor(
      req.params.instructorId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Instructor application rejected',
      data: instructor,
    });
  } catch (err) {
    next(err);
  }
};

// Courses
exports.getCourses = async (req, res, next) => {
  try {
    const result = await adminCourseService.getCourses(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getPendingCourses = async (req, res, next) => {
  try {
    const result = await adminCourseService.getPendingCourses(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getCourseReview = async (req, res, next) => {
  try {
    const result = await adminCourseService.getCourseReview(req.params.courseId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.approveCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.approveCourse(req.params.courseId, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Course approved successfully',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.rejectCourse(
      req.params.courseId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Course rejected',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

exports.publishCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.publishCourse(req.params.courseId, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Course published to catalog',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

exports.unpublishCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.unpublishCourse(
      req.params.courseId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Course unpublished from catalog',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

exports.archiveCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.archiveCourse(req.params.courseId, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Course archived successfully',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

exports.flagCourse = async (req, res, next) => {
  try {
    const course = await adminCourseService.flagCourse(
      req.params.courseId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Course content flagged for review',
      data: course,
    });
  } catch (err) {
    next(err);
  }
};

// Assessments & Coding
exports.getAssessments = async (req, res, next) => {
  try {
    const result = await adminCourseService.getAssessments(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getCodingProblems = async (req, res, next) => {
  try {
    const result = await adminCourseService.getCodingProblems(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await adminSuperService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await adminSuperService.createCategory(req.body, req.user, req);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

exports.archiveCategory = async (req, res, next) => {
  try {
    const category = await adminSuperService.archiveCategory(
      req.params.categoryId,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Category archived successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Reports
exports.getReports = async (req, res, next) => {
  try {
    const result = await adminSuperService.getReports(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const report = await adminSuperService.getReportById(req.params.reportId);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const report = await adminSuperService.updateReport(
      req.params.reportId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// Audit Logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminAuditService.getAuditLogs(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.exportAuditLogs = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const { data, contentType } = await adminAuditService.exportLogs({
      ...req.query,
      actor: req.user,
      req,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'attachment; filename="admin-audit-logs.csv"');
      return res.status(200).send(data);
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Announcements
exports.getAnnouncements = async (req, res, next) => {
  try {
    const result = await adminSuperService.getAnnouncements(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await adminSuperService.createAnnouncement(req.body, req.user, req);
    res.status(201).json({
      success: true,
      message: 'Platform announcement published',
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
};

// Feature Flags & Settings
exports.getFeatureFlags = async (req, res, next) => {
  try {
    const flags = await adminSuperService.getFeatureFlags();
    res.status(200).json({ success: true, data: flags });
  } catch (err) {
    next(err);
  }
};

exports.updateFeatureFlag = async (req, res, next) => {
  try {
    const flag = await adminSuperService.updateFeatureFlag(
      req.params.key,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: `Feature flag ${flag.key} updated`,
      data: flag,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await adminSuperService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { group, settings } = req.body;
    const updated = await adminSuperService.updateSettings(group, settings, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Super Admin Only: Admin Management
exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await adminSuperService.getAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const admin = await adminSuperService.createAdmin(req.body, req.user, req);
    res.status(201).json({
      success: true,
      message: 'Administrator account provisioned',
      data: admin,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAdminPermissions = async (req, res, next) => {
  try {
    const admin = await adminSuperService.updateAdminPermissions(
      req.params.adminId,
      req.body,
      req.user,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Administrator permissions updated',
      data: admin,
    });
  } catch (err) {
    next(err);
  }
};

exports.disableAdmin = async (req, res, next) => {
  try {
    const admin = await adminSuperService.disableAdmin(req.params.adminId, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Administrator account disabled',
      data: admin,
    });
  } catch (err) {
    next(err);
  }
};
