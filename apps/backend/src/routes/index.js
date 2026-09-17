const express = require('express');
const healthRoutes = require('./api/v1/health.route');
const authRoutes = require('./api/v1/auth.route');
const adminRoutes = require('./api/v1/admin.route');
const studentRoutes = require('./api/v1/student.route');
const courseRoutes = require('./api/v1/course.route');
const enrollmentRoutes = require('./api/v1/enrollment.route');
const progressRoutes = require('./api/v1/progress.route');
const bookmarkRoutes = require('./api/v1/bookmark.route');
const assessmentRoutes = require('./api/v1/assessment.route');
const practiceRoutes = require('./api/v1/practice.route');
const aiRoutes = require('./api/v1/ai.route');
const instructorRoutes = require('./api/v1/instructor.route');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/instructor', instructorRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/practice', practiceRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
