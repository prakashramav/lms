const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const Submission = require('../../models/submission.model');
const { User } = require('../../models/user.model');

/**
 * Get students enrolled in instructor's courses
 */
const getInstructorStudents = async (instructorId, {
  page = 1,
  limit = 20,
  search = '',
  courseId,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Find all courses owned by instructor
  const instructorCourses = await Course.find({ instructor: instructorId }).select('_id title slug');
  const courseIds = instructorCourses.map((c) => c._id);

  if (courseIds.length === 0) {
    return {
      items: [],
      page: 1,
      limit: limitNum,
      total: 0,
      totalPages: 1,
    };
  }

  const query = {
    courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : { $in: courseIds },
  };

  const enrollments = await Enrollment.find(query)
    .populate('studentId', 'name email role createdAt')
    .populate('courseId', 'title slug thumbnail difficulty')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Enrollment.countDocuments(query);

  let filtered = enrollments.filter((e) => e.studentId != null);

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.studentId?.name?.toLowerCase().includes(term) ||
        e.studentId?.email?.toLowerCase().includes(term)
    );
  }

  return {
    items: filtered.map((e) => ({
      _id: e._id,
      student: {
        _id: e.studentId._id,
        name: e.studentId.name,
        email: e.studentId.email,
        joinedAt: e.studentId.createdAt,
      },
      course: {
        _id: e.courseId._id,
        title: e.courseId.title,
        slug: e.courseId.slug,
        difficulty: e.courseId.difficulty,
      },
      status: e.status,
      progressPercentage: e.progressPercentage || 0,
      enrolledAt: e.createdAt,
      lastActiveAt: e.updatedAt,
      completedAt: e.completedAt || null,
    })),
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Get detailed progress of a specific student in an instructor's course
 */
const getStudentCourseDetail = async (instructorId, courseId, studentId) => {
  // Verify instructor owns the course
  const course = await Course.findOne({ _id: courseId, instructor: instructorId }).lean();
  if (!course) {
    const err = new Error('Course not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  const [student, enrollment, progressRecords, assessmentAttempts, codingSubmissions] = await Promise.all([
    User.findById(studentId).select('name email createdAt').lean(),
    Enrollment.findOne({ courseId, studentId }).lean(),
    Progress.find({ courseId, studentId }).populate('lessonId', 'title slug type duration').lean(),
    AssessmentAttempt.find({ studentId, courseId, status: 'SUBMITTED' })
      .populate('assessmentId', 'title type totalMarks')
      .sort({ createdAt: -1 })
      .lean(),
    Submission.find({ studentId }).populate('problemId', 'title difficulty category').limit(20).lean(),
  ]);

  if (!student) {
    const err = new Error('Student not found.');
    err.statusCode = 404;
    throw err;
  }

  return {
    student,
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
    },
    enrollment: enrollment || null,
    progressSummary: {
      completedLessons: progressRecords.filter((p) => p.isCompleted).length,
      totalTrackedLessons: progressRecords.length,
      progressPercentage: enrollment ? enrollment.progressPercentage : 0,
    },
    lessonsProgress: progressRecords.map((p) => ({
      lessonId: p.lessonId?._id,
      title: p.lessonId?.title || 'Lesson',
      type: p.lessonId?.type,
      isCompleted: p.isCompleted,
      timeSpentMinutes: Math.round((p.timeSpent || 0) / 60),
      completedAt: p.completedAt,
    })),
    assessments: assessmentAttempts.map((a) => ({
      assessmentId: a.assessmentId?._id,
      title: a.assessmentId?.title || 'Assessment',
      scorePercentage: a.scorePercentage,
      passed: a.passed,
      attemptNumber: a.attemptNumber,
      submittedAt: a.submittedAt,
    })),
    recentCodingSubmissions: codingSubmissions.map((s) => ({
      problemId: s.problemId?._id,
      title: s.problemId?.title || 'Problem',
      difficulty: s.problemId?.difficulty,
      verdict: s.verdict,
      language: s.language,
      submittedAt: s.createdAt,
    })),
  };
};

module.exports = {
  getInstructorStudents,
  getStudentCourseDetail,
};
