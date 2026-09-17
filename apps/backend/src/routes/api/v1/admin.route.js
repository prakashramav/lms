const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  requireAdmin,
  requirePermission,
  requireSuperAdmin,
} = require('../../../middlewares/admin.permission.middleware');
const adminController = require('../../../controllers/admin.controller');
const intelligenceController = require('../../../controllers/intelligence.controller');

const router = express.Router();

// All administrative routes require valid authentication and ADMIN or SUPER_ADMIN role
router.use(authenticate, requireAdmin);

// ==========================================
// 1. SYSTEM HEALTH & OVERVIEW
// ==========================================
router.get('/overview', adminController.getOverview);
router.get('/system/health', adminController.getSystemHealth);

// ==========================================
// 2. ANALYTICS & AI MONITORING
// ==========================================
router.get('/analytics/overview', requirePermission('analytics.read'), adminController.getAnalyticsOverview);
router.get('/analytics/users', requirePermission('analytics.read'), adminController.getUserAnalytics);
router.get('/analytics/courses', requirePermission('analytics.read'), adminController.getCourseAnalytics);
router.get('/analytics/learning', requirePermission('analytics.read'), adminController.getLearningAnalytics);
router.get('/analytics/ai', requirePermission('analytics.read'), adminController.getAiMonitoring);

// Phase 11: Learning Health & Intelligence Analytics
router.get('/analytics/learning-health', requirePermission('analytics.read'), intelligenceController.getPlatformLearningHealth);
router.get('/analytics/recommendations', requirePermission('analytics.read'), intelligenceController.getAdminRecommendations);
router.get('/analytics/engagement', requirePermission('analytics.read'), intelligenceController.getAdminEngagement);

// ==========================================
// 3. USER MANAGEMENT (STUDENTS & INSTRUCTORS)
// ==========================================
router.get('/users', requirePermission('users.read'), adminController.getUsers);
router.get('/users/:userId', requirePermission('users.read'), adminController.getUserById);
router.patch('/users/:userId/status', requirePermission('users.suspend'), adminController.updateUserStatus);

router.get('/students', requirePermission('users.read'), adminController.getStudents);
router.get('/students/:studentId', requirePermission('users.read'), adminController.getStudentDetail);

router.get('/instructors', requirePermission('users.read'), adminController.getInstructors);
router.get('/instructors/:instructorId', requirePermission('users.read'), adminController.getInstructorDetail);
router.post('/instructors/:instructorId/approve', requirePermission('instructors.approve'), adminController.approveInstructor);
router.post('/instructors/:instructorId/reject', requirePermission('instructors.approve'), adminController.rejectInstructor);
router.post('/instructors/:instructorId/suspend', requirePermission('users.suspend'), (req, res, next) => {
  req.body.status = 'SUSPENDED';
  return adminController.updateUserStatus(req, res, next);
});
router.post('/instructors/:instructorId/activate', requirePermission('users.suspend'), (req, res, next) => {
  req.body.status = 'ACTIVE';
  return adminController.updateUserStatus(req, res, next);
});

// ==========================================
// 4. COURSE MANAGEMENT & APPROVALS
// ==========================================
router.get('/courses', requirePermission('courses.read'), adminController.getCourses);
router.get('/courses/pending', requirePermission('courses.review'), adminController.getPendingCourses);
router.get('/courses/:courseId/review', requirePermission('courses.review'), adminController.getCourseReview);
router.post('/courses/:courseId/approve', requirePermission('courses.approve'), adminController.approveCourse);
router.post('/courses/:courseId/reject', requirePermission('courses.approve'), adminController.rejectCourse);
router.post('/courses/:courseId/publish', requirePermission('courses.publish'), adminController.publishCourse);
router.post('/courses/:courseId/unpublish', requirePermission('courses.publish'), adminController.unpublishCourse);
router.post('/courses/:courseId/archive', requirePermission('courses.publish'), adminController.archiveCourse);
router.post('/courses/:courseId/flag', requirePermission('courses.review'), adminController.flagCourse);

// ==========================================
// 5. ASSESSMENTS & CODING PROBLEMS
// ==========================================
router.get('/assessments', requirePermission('assessments.manage'), adminController.getAssessments);
router.get('/coding-problems', requirePermission('problems.manage'), adminController.getCodingProblems);

// ==========================================
// 6. CATEGORIES & TAXONOMY
// ==========================================
router.get('/categories', adminController.getCategories);
router.post('/categories', requirePermission('categories.manage'), adminController.createCategory);
router.delete('/categories/:categoryId', requirePermission('categories.manage'), adminController.archiveCategory);

// ==========================================
// 7. CONTENT MODERATION & REPORTS
// ==========================================
router.get('/reports', requirePermission('reports.manage'), adminController.getReports);
router.get('/reports/:reportId', requirePermission('reports.manage'), adminController.getReportById);
router.patch('/reports/:reportId', requirePermission('reports.manage'), adminController.updateReport);

// ==========================================
// 8. AUDIT LOGS
// ==========================================
router.get('/audit-logs', requirePermission('audit.read'), adminController.getAuditLogs);
router.get('/audit-logs/export', requirePermission('audit.read'), adminController.exportAuditLogs);

// ==========================================
// 9. PLATFORM ANNOUNCEMENTS
// ==========================================
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', requirePermission('settings.manage'), adminController.createAnnouncement);

// ==========================================
// 10. SETTINGS & FEATURE FLAGS
// ==========================================
router.get('/settings', requirePermission('settings.manage'), adminController.getSettings);
router.patch('/settings', requirePermission('settings.manage'), adminController.updateSettings);

router.get('/feature-flags', requirePermission('settings.manage'), adminController.getFeatureFlags);
router.patch('/feature-flags/:key', requirePermission('settings.manage'), adminController.updateFeatureFlag);

// ==========================================
// 11. SUPER ADMIN ONLY: ADMINISTRATOR MANAGEMENT
// ==========================================
router.get('/admins', requireSuperAdmin, adminController.getAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.patch('/admins/:adminId', requireSuperAdmin, adminController.updateAdminPermissions);
router.post('/admins/:adminId/disable', requireSuperAdmin, adminController.disableAdmin);

// ==========================================
// 12. PHASE 12: CAREER & PLACEMENT MANAGEMENT
// ==========================================
const careerController = require('../../../controllers/career.controller');
router.get('/career/analytics', careerController.getAdminPlacementAnalytics);
router.patch('/career/jobs/:jobId/status', careerController.adminUpdateJobStatus);
router.get('/career/reports', careerController.getJobReports);
router.patch('/career/reports/:reportId', careerController.adminReviewJobReport);
router.post('/career/paths', careerController.createCareerPath);
router.patch('/career/paths/:careerPathId', careerController.updateCareerPath);

module.exports = router;

