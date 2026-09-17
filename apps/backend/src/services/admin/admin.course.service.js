const { Course } = require('../../models/course.model');
const Module = require('../../models/module.model');
const { Lesson } = require('../../models/lesson.model');
const Assessment = require('../../models/assessment.model');
const Question = require('../../models/question.model');
const { Problem } = require('../../models/problem.model');
const { Enrollment } = require('../../models/enrollment.model');
const adminAuditService = require('./admin.audit.service');

class AdminCourseService {
  /**
   * Paginated list of courses with status/category/search filters
   */
  async getCourses({
    page = 1,
    limit = 20,
    status,
    category,
    difficulty,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status) query.status = status.toUpperCase();
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty.toUpperCase();

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: new RegExp(sanitized, 'i') },
        { shortDescription: new RegExp(sanitized, 'i') },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .populate('reviewedBy', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(query),
    ]);

    // Enhance with enrollments count
    const courseIds = courses.map((c) => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    enrollmentCounts.forEach((e) => {
      countMap[e._id.toString()] = e.count;
    });

    const enrichedCourses = courses.map((c) => ({
      ...c,
      enrollmentCount: countMap[c._id.toString()] || 0,
    }));

    return {
      courses: enrichedCourses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Pending approval queue
   */
  async getPendingCourses({ page = 1, limit = 20, search } = {}) {
    return this.getCourses({ page, limit, status: 'PENDING_REVIEW', search });
  }

  /**
   * Comprehensive course review details
   */
  async getCourseReview(courseId) {
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email bio avatar')
      .populate('reviewedBy', 'name email')
      .populate('publishedBy', 'name email')
      .lean();

    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    // Load curriculum hierarchy
    const modules = await Module.find({ courseId }).sort({ order: 1 }).lean();
    const moduleIds = modules.map((m) => m._id);

    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } })
      .sort({ order: 1 })
      .lean();

    const assessments = await Assessment.find({ courseId }).lean();
    const codingProblems = await Problem.find({
      tags: { $in: course.skills || [] },
    })
      .select('-testCases')
      .limit(10)
      .lean();

    const enrollmentsCount = await Enrollment.countDocuments({ courseId });

    return {
      course,
      modules: modules.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.moduleId.toString() === m._id.toString()),
      })),
      assessments,
      codingProblems,
      stats: {
        enrollmentsCount,
        modulesCount: modules.length,
        lessonsCount: lessons.length,
        assessmentsCount: assessments.length,
      },
    };
  }

  /**
   * Approve course for publishing
   */
  async approveCourse(courseId, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.status = 'APPROVED';
    course.reviewedBy = adminUser._id;
    course.reviewedAt = new Date();
    course.rejectionReason = null;
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_APPROVED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { title: course.title, slug: course.slug },
      req,
    });

    return course;
  }

  /**
   * Reject course with reason
   */
  async rejectCourse(courseId, { reason }, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.status = 'REJECTED';
    course.isPublished = false;
    course.reviewedBy = adminUser._id;
    course.reviewedAt = new Date();
    course.rejectionReason = reason || 'Does not meet curriculum standards';
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_REJECTED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { title: course.title, reason },
      req,
    });

    return course;
  }

  /**
   * Publish course to public catalog
   */
  async publishCourse(courseId, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.status = 'PUBLISHED';
    course.isPublished = true;
    course.publishedAt = new Date();
    course.publishedBy = adminUser._id;
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_PUBLISHED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { title: course.title, slug: course.slug },
      req,
    });

    return course;
  }

  /**
   * Unpublish course from public catalog
   */
  async unpublishCourse(courseId, { reason }, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.status = 'APPROVED';
    course.isPublished = false;
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_UNPUBLISHED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { title: course.title, reason },
      req,
    });

    return course;
  }

  /**
   * Archive course
   */
  async archiveCourse(courseId, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.status = 'ARCHIVED';
    course.isPublished = false;
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_ARCHIVED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { title: course.title },
      req,
    });

    return course;
  }

  /**
   * Flag course content
   */
  async flagCourse(courseId, { reason }, adminUser, req = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    course.moderationFlags.push({
      reason,
      flaggedBy: adminUser._id,
      flaggedAt: new Date(),
      resolved: false,
    });
    await course.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'COURSE_CONTENT_FLAGGED',
      resourceType: 'COURSE',
      resourceId: course._id,
      metadata: { reason },
      req,
    });

    return course;
  }

  /**
   * Assessments Management - List all assessments
   */
  async getAssessments({ page = 1, limit = 20, search, status } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (search && search.trim()) {
      query.title = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .populate('courseId', 'title slug')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Assessment.countDocuments(query),
    ]);

    return {
      assessments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Coding Problems Management - List problems (Answer keys and hidden test cases protected)
   */
  async getCodingProblems({ page = 1, limit = 20, search, difficulty, category } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (difficulty) query.difficulty = difficulty.toUpperCase();
    if (category) query.category = category;
    if (search && search.trim()) {
      query.title = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .select('-testCases -starterCode -solutions')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Problem.countDocuments(query),
    ]);

    return {
      problems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

module.exports = new AdminCourseService();
