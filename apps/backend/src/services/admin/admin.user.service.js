const { User } = require('../../models/user.model');
const { Course } = require('../../models/course.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { Submission } = require('../../models/submission.model');
const adminAuditService = require('./admin.audit.service');

class AdminUserService {
  /**
   * List users with search, role/status filtering, and pagination
   */
  async getUsers({
    page = 1,
    limit = 20,
    role,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (role) {
      query.role = role.toUpperCase();
    }
    if (status) {
      query.status = status.toUpperCase();
    }
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: new RegExp(sanitized, 'i') },
        { email: new RegExp(sanitized, 'i') },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get single user operational detail
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
      .populate('suspendedBy', 'name email')
      .lean();

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }

  /**
   * Update user lifecycle status (ACTIVE, SUSPENDED, DEACTIVATED, etc.)
   */
  async updateUserStatus(userId, { status, reason }, adminUser, req = null) {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Normal admins cannot modify SUPER_ADMIN accounts
    if (targetUser.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      const err = new Error('Access denied. Cannot modify Super Administrator account.');
      err.statusCode = 403;
      throw err;
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;

    if (status === 'SUSPENDED') {
      targetUser.suspensionReason = reason || 'Administrative action';
      targetUser.suspendedAt = new Date();
      targetUser.suspendedBy = adminUser._id;
    } else if (status === 'ACTIVE') {
      targetUser.suspensionReason = null;
      targetUser.suspendedAt = null;
      targetUser.suspendedBy = null;
    }

    await targetUser.save();

    // Audit log
    await adminAuditService.recordAction({
      actor: adminUser,
      action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_STATUS_UPDATED',
      resourceType: 'USER',
      resourceId: targetUser._id,
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        previousStatus,
        newStatus: status,
        reason,
      },
      req,
    });

    return targetUser;
  }

  /**
   * Student Management - list students with enrollment counters
   */
  async getStudents({ page = 1, limit = 20, search, status } = {}) {
    return this.getUsers({ page, limit, role: 'STUDENT', status, search });
  }

  /**
   * Detailed Student Operational Inspection
   */
  async getStudentDetail(studentId) {
    const student = await this.getUserById(studentId);
    if (student.role !== 'STUDENT') {
      const err = new Error('User is not a student');
      err.statusCode = 400;
      throw err;
    }

    // Fetch enrollments with course details
    const enrollments = await Enrollment.find({ studentId })
      .populate({
        path: 'courseId',
        select: 'title slug thumbnail category difficulty',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch assessment summary
    const assessmentAttempts = await AssessmentAttempt.find({ studentId })
      .populate('assessmentId', 'title slug passingScore')
      .select('score percentage passed attemptNumber status submittedAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Fetch coding submissions summary
    const codingSubmissions = await Submission.find({ studentId })
      .populate('problemId', 'title slug difficulty')
      .select('status language executionTime memory passedTestCases totalTestCases createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return {
      student,
      enrollments,
      assessmentAttempts,
      codingSubmissions,
      stats: {
        totalEnrollments: enrollments.length,
        completedEnrollments: enrollments.filter((e) => e.status === 'COMPLETED').length,
        totalAssessmentAttempts: assessmentAttempts.length,
        totalCodingSubmissions: codingSubmissions.length,
      },
    };
  }

  /**
   * Instructor Management - list instructors
   */
  async getInstructors({ page = 1, limit = 20, search, status } = {}) {
    return this.getUsers({ page, limit, role: 'INSTRUCTOR', status, search });
  }

  /**
   * Detailed Instructor Operational Inspection
   */
  async getInstructorDetail(instructorId) {
    const instructor = await this.getUserById(instructorId);
    if (instructor.role !== 'INSTRUCTOR') {
      const err = new Error('User is not an instructor');
      err.statusCode = 400;
      throw err;
    }

    const courses = await Course.find({ instructor: instructorId })
      .select('title slug status isPublished category difficulty createdAt publishedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total students enrolled across all instructor courses
    const courseIds = courses.map((c) => c._id);
    const totalStudents = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

    return {
      instructor,
      courses,
      stats: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
        pendingCourses: courses.filter((c) => c.status === 'PENDING_REVIEW').length,
        totalStudents,
      },
    };
  }

  /**
   * Approve Instructor Application
   */
  async approveInstructor(instructorId, adminUser, req = null) {
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      const err = new Error('Instructor not found');
      err.statusCode = 404;
      throw err;
    }

    instructor.status = 'ACTIVE';
    instructor.suspensionReason = null;
    await instructor.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'INSTRUCTOR_APPROVED',
      resourceType: 'INSTRUCTOR',
      resourceId: instructor._id,
      metadata: { email: instructor.email, name: instructor.name },
      req,
    });

    return instructor;
  }

  /**
   * Reject Instructor Application
   */
  async rejectInstructor(instructorId, { reason }, adminUser, req = null) {
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      const err = new Error('Instructor not found');
      err.statusCode = 404;
      throw err;
    }

    instructor.status = 'DEACTIVATED';
    instructor.suspensionReason = reason || 'Instructor application rejected';
    await instructor.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'INSTRUCTOR_REJECTED',
      resourceType: 'INSTRUCTOR',
      resourceId: instructor._id,
      metadata: { email: instructor.email, name: instructor.name, reason },
      req,
    });

    return instructor;
  }
}

module.exports = new AdminUserService();
