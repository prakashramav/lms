const express = require('express');
const {
  getCourses,
  createCourse,
  getCourseDetail,
  updateCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
  duplicateCourse,
  addModule,
  updateModule,
  deleteModule,
  reorderModules,
  addLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  uploadFile,
  attachResource,
  deleteResource,
  getAssessments,
  createAssessment,
  getAssessmentDetail,
  updateAssessment,
  deleteAssessment,
  getQuestionBank,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  getProblems,
  createProblem,
  getProblemDetail,
  updateProblem,
  publishProblem,
  unpublishProblem,
  deleteProblem,
  addTestCase,
  deleteTestCase,
  getStudents,
  getStudentDetail,
  getOverviewAnalytics,
  getCourseAnalytics,
  generateLessonOutline,
  generateQuestions,
  generateCodingProblem,
  getNotifications,
  markNotificationRead,
} = require('../../../controllers/instructor.controller');

const { authenticate, authorize } = require('../../../middlewares/auth.middleware');
const {
  requireCourseOwner,
  requireModuleOwner,
  requireLessonOwner,
  requireAssessmentOwner,
  requireProblemOwner,
} = require('../../../middlewares/instructor.owner.middleware');

const router = express.Router();

// Strict RBAC: All routes require authentication and INSTRUCTOR or ADMIN role
router.use(authenticate, authorize('INSTRUCTOR', 'ADMIN'));

const intelligenceController = require('../../../controllers/intelligence.controller');

// -------------------------------------------------------------
// ANALYTICS & OVERVIEW
// -------------------------------------------------------------
router.get('/analytics/overview', getOverviewAnalytics);
router.get('/courses/:courseId/analytics', requireCourseOwner, getCourseAnalytics);

// Phase 11: Course Intelligence & Student Support Signals
router.get('/courses/:courseId/intelligence', requireCourseOwner, intelligenceController.getCourseIntelligence);
router.get('/courses/:courseId/weak-topics', requireCourseOwner, intelligenceController.getCourseWeakTopics);
router.get('/courses/:courseId/common-mistakes', requireCourseOwner, intelligenceController.getCourseCommonMistakes);

// -------------------------------------------------------------
// COURSE MANAGEMENT
// -------------------------------------------------------------
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.get('/courses/:courseId', requireCourseOwner, getCourseDetail);
router.patch('/courses/:courseId', requireCourseOwner, updateCourse);
router.delete('/courses/:courseId', requireCourseOwner, archiveCourse);
router.post('/courses/:courseId/publish', requireCourseOwner, publishCourse);
router.post('/courses/:courseId/unpublish', requireCourseOwner, unpublishCourse);
router.post('/courses/:courseId/duplicate', requireCourseOwner, duplicateCourse);

// -------------------------------------------------------------
// MODULES
// -------------------------------------------------------------
router.post('/courses/:courseId/modules', requireCourseOwner, addModule);
router.patch('/courses/:courseId/modules/reorder', requireCourseOwner, reorderModules);
router.patch('/modules/:moduleId', requireModuleOwner, updateModule);
router.delete('/modules/:moduleId', requireModuleOwner, deleteModule);

// -------------------------------------------------------------
// LESSONS
// -------------------------------------------------------------
router.post('/modules/:moduleId/lessons', requireModuleOwner, addLesson);
router.patch('/modules/:moduleId/lessons/reorder', requireModuleOwner, reorderLessons);
router.patch('/lessons/:lessonId', requireLessonOwner, updateLesson);
router.delete('/lessons/:lessonId', requireLessonOwner, deleteLesson);

// -------------------------------------------------------------
// RESOURCES & MEDIA UPLOADS
// -------------------------------------------------------------
router.post('/upload', uploadFile);
router.post('/lessons/:lessonId/resources', requireLessonOwner, attachResource);
router.delete('/resources/:resourceId', deleteResource);

// -------------------------------------------------------------
// ASSESSMENTS & QUESTION BANK
// -------------------------------------------------------------
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.get('/assessments/:assessmentId', requireAssessmentOwner, getAssessmentDetail);
router.patch('/assessments/:assessmentId', requireAssessmentOwner, updateAssessment);
router.delete('/assessments/:assessmentId', requireAssessmentOwner, deleteAssessment);

router.get('/questions', getQuestionBank);
router.post('/questions', createQuestion);
router.patch('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);
router.post('/questions/:questionId/duplicate', duplicateQuestion);

// -------------------------------------------------------------
// CODING CHALLENGES & TEST CASES
// -------------------------------------------------------------
router.get('/problems', getProblems);
router.post('/problems', createProblem);
router.get('/problems/:problemId', requireProblemOwner, getProblemDetail);
router.patch('/problems/:problemId', requireProblemOwner, updateProblem);
router.delete('/problems/:problemId', requireProblemOwner, deleteProblem);
router.post('/problems/:problemId/publish', requireProblemOwner, publishProblem);
router.post('/problems/:problemId/unpublish', requireProblemOwner, unpublishProblem);
router.post('/problems/:problemId/test-cases', requireProblemOwner, addTestCase);
router.delete('/problems/:problemId/test-cases/:testCaseId', requireProblemOwner, deleteTestCase);

// -------------------------------------------------------------
// STUDENTS COHORT
// -------------------------------------------------------------
router.get('/students', getStudents);
router.get('/courses/:courseId/students/:studentId', requireCourseOwner, getStudentDetail);

// -------------------------------------------------------------
// AI AUTHORING ASSISTANT
// -------------------------------------------------------------
router.post('/ai/generate-outline', generateLessonOutline);
router.post('/ai/generate-questions', generateQuestions);
router.post('/ai/generate-problem', generateCodingProblem);

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);

module.exports = router;
