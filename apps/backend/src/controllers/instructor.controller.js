const courseService = require('../services/instructor/course.service');
const assessmentService = require('../services/instructor/assessment.service');
const problemService = require('../services/instructor/problem.service');
const studentService = require('../services/instructor/student.service');
const analyticsService = require('../services/instructor/analytics.service');
const aiService = require('../services/instructor/ai.service');
const { storageService } = require('../services/storage/storage.service');
const Resource = require('../models/resource.model');
const Notification = require('../models/notification.model');
const { logAction } = require('../services/audit.service');

// ==========================================
// COURSE HANDLERS
// ==========================================

const getCourses = async (req, res, next) => {
  try {
    const data = await courseService.getInstructorCourses(req.user._id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

const getCourseDetail = async (req, res, next) => {
  try {
    const data = await courseService.getCourseDetail(req.params.courseId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.courseId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

const publishCourse = async (req, res, next) => {
  try {
    const course = await courseService.publishCourse(req.params.courseId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Course published successfully. It is now accessible to students.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

const unpublishCourse = async (req, res, next) => {
  try {
    const course = await courseService.unpublishCourse(req.params.courseId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Course unpublished. Existing students retain enrollment data.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

const archiveCourse = async (req, res, next) => {
  try {
    const course = await courseService.archiveCourse(req.params.courseId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Course archived successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

const duplicateCourse = async (req, res, next) => {
  try {
    const course = await courseService.duplicateCourse(req.params.courseId, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Course duplicated successfully as draft.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MODULE HANDLERS
// ==========================================

const addModule = async (req, res, next) => {
  try {
    const moduleDoc = await courseService.addModule(req.params.courseId, req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Module created successfully.',
      data: { module: moduleDoc },
    });
  } catch (error) {
    next(error);
  }
};

const updateModule = async (req, res, next) => {
  try {
    const moduleDoc = await courseService.updateModule(req.params.moduleId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      data: { module: moduleDoc },
    });
  } catch (error) {
    next(error);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    const result = await courseService.deleteModule(req.params.moduleId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const reorderModules = async (req, res, next) => {
  try {
    const { moduleIds } = req.body;
    const result = await courseService.reorderModules(req.params.courseId, req.user._id, moduleIds);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LESSON HANDLERS
// ==========================================

const addLesson = async (req, res, next) => {
  try {
    const lesson = await courseService.addLesson(req.params.moduleId, req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Lesson created successfully.',
      data: { lesson },
    });
  } catch (error) {
    next(error);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const lesson = await courseService.updateLesson(req.params.lessonId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully.',
      data: { lesson },
    });
  } catch (error) {
    next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const result = await courseService.deleteLesson(req.params.lessonId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const reorderLessons = async (req, res, next) => {
  try {
    const { lessonIds } = req.body;
    const result = await courseService.reorderLessons(req.params.moduleId, req.user._id, lessonIds);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RESOURCE & UPLOAD HANDLERS
// ==========================================

const uploadFile = async (req, res, next) => {
  try {
    const { name, data, mimeType, folder = 'resources' } = req.body;
    if (!name || !data) {
      return res.status(400).json({
        success: false,
        message: 'File name and base64 data are required.',
      });
    }

    // Convert base64 data to buffer
    const base64Data = data.includes(';base64,') ? data.split(';base64,').pop() : data;
    const buffer = Buffer.from(base64Data, 'base64');

    const uploaded = await storageService.uploadFile(
      {
        buffer,
        originalname: name,
        mimetype: mimeType || 'application/octet-stream',
        size: buffer.length,
      },
      folder
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: uploaded,
    });
  } catch (error) {
    next(error);
  }
};

const attachResource = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { name, type = 'LINK', url, key, size = 0, mimeType = 'text/plain', courseId } = req.body;

    if (!name || !url || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Resource name, url, and courseId are required.',
      });
    }

    const resource = await Resource.create({
      name,
      type,
      url,
      key,
      size,
      mimeType,
      lessonId: lessonId || null,
      courseId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Resource attached successfully.',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (resource.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resource.' });
    }

    if (resource.key) {
      await storageService.deleteFile(resource.key);
    }
    await Resource.findByIdAndDelete(resource._id);

    res.status(200).json({ success: true, message: 'Resource deleted.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ASSESSMENT & QUESTION HANDLERS
// ==========================================

const getAssessments = async (req, res, next) => {
  try {
    const data = await assessmentService.getInstructorAssessments(req.user._id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createAssessment = async (req, res, next) => {
  try {
    const assessment = await assessmentService.createAssessment(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Assessment created successfully.',
      data: { assessment },
    });
  } catch (error) {
    next(error);
  }
};

const getAssessmentDetail = async (req, res, next) => {
  try {
    const data = await assessmentService.getAssessmentDetail(req.params.assessmentId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateAssessment = async (req, res, next) => {
  try {
    const assessment = await assessmentService.updateAssessment(req.params.assessmentId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully.',
      data: { assessment },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssessment = async (req, res, next) => {
  try {
    const result = await assessmentService.deleteAssessment(req.params.assessmentId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getQuestionBank = async (req, res, next) => {
  try {
    const data = await assessmentService.getQuestionBank(req.user._id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const question = await assessmentService.createQuestion(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Question added to assessment successfully.',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await assessmentService.updateQuestion(req.params.questionId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const result = await assessmentService.deleteQuestion(req.params.questionId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const duplicateQuestion = async (req, res, next) => {
  try {
    const question = await assessmentService.duplicateQuestion(
      req.params.questionId,
      req.body.targetAssessmentId,
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: 'Question duplicated successfully.',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CODING PROBLEM HANDLERS
// ==========================================

const getProblems = async (req, res, next) => {
  try {
    const data = await problemService.getInstructorProblems(req.user._id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createProblem = async (req, res, next) => {
  try {
    const problem = await problemService.createProblem(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Coding problem created successfully.',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

const getProblemDetail = async (req, res, next) => {
  try {
    const data = await problemService.getProblemDetail(req.params.problemId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateProblem = async (req, res, next) => {
  try {
    const problem = await problemService.updateProblem(req.params.problemId, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Coding problem updated successfully.',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

const publishProblem = async (req, res, next) => {
  try {
    const problem = await problemService.publishProblem(req.params.problemId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Coding problem published successfully.',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

const unpublishProblem = async (req, res, next) => {
  try {
    const problem = await problemService.unpublishProblem(req.params.problemId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Coding problem unpublished.',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProblem = async (req, res, next) => {
  try {
    const result = await problemService.deleteProblem(req.params.problemId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const addTestCase = async (req, res, next) => {
  try {
    const testCase = await problemService.addTestCase(req.params.problemId, req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Test case added successfully.',
      data: { testCase },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestCase = async (req, res, next) => {
  try {
    const result = await problemService.deleteTestCase(req.params.problemId, req.params.testCaseId, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STUDENT & ANALYTICS HANDLERS
// ==========================================

const getStudents = async (req, res, next) => {
  try {
    const data = await studentService.getInstructorStudents(req.user._id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getStudentDetail = async (req, res, next) => {
  try {
    const data = await studentService.getStudentCourseDetail(
      req.user._id,
      req.params.courseId,
      req.params.studentId
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getOverviewAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewAnalytics(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCourseAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getCourseAnalytics(req.params.courseId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AI AUTHORING HANDLERS
// ==========================================

const generateLessonOutline = async (req, res, next) => {
  try {
    const { topic, level, courseContext } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    const outline = await aiService.generateLessonOutline(topic, level, courseContext);
    res.status(200).json({
      success: true,
      message: 'Lesson outline draft generated. Review and edit before saving.',
      data: outline,
    });
  } catch (error) {
    next(error);
  }
};

const generateQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, count } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    const questions = await aiService.generateQuestions(topic, difficulty, count);
    res.status(200).json({
      success: true,
      message: 'Draft questions generated. Review each question before publishing.',
      data: { questions },
    });
  } catch (error) {
    next(error);
  }
};

const generateCodingProblem = async (req, res, next) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    const problem = await aiService.generateCodingProblem(topic, difficulty);
    res.status(200).json({
      success: true,
      message: 'Draft coding problem generated. Verify test cases before publishing.',
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// NOTIFICATIONS HANDLERS
// ==========================================

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    const unreadCount = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    if (req.params.notificationId === 'all') {
      await Notification.updateMany({ recipientId: req.user._id }, { $set: { isRead: true } });
    } else {
      await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, recipientId: req.user._id },
        { $set: { isRead: true } }
      );
    }
    res.status(200).json({ success: true, message: 'Notifications updated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
