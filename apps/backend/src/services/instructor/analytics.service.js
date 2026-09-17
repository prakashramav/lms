const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const Assessment = require('../../models/assessment.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const Problem = require('../../models/problem.model');
const Submission = require('../../models/submission.model');

/**
 * Overview dashboard metrics for authenticated instructor
 */
const getOverviewAnalytics = async (instructorId) => {
  // Find all courses by instructor
  const courses = await Course.find({ instructor: instructorId }).select('_id title isPublished status createdAt').lean();
  const courseIds = courses.map((c) => c._id);

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;

  if (courseIds.length === 0) {
    return {
      kpis: {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalStudents: 0,
        totalEnrollments: 0,
        averageCompletion: 0,
        averageAssessmentScore: 0,
      },
      recentActivity: [],
      coursePerformance: [],
    };
  }

  // Aggregate enrollments for instructor's courses
  const [enrollmentAgg, distinctStudents, assessmentAgg, recentEnrollments, recentProgress] = await Promise.all([
    Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          avgCompletion: { $avg: '$progressPercentage' },
        },
      },
    ]),
    Enrollment.distinct('studentId', { courseId: { $in: courseIds } }),
    AssessmentAttempt.aggregate([
      { $match: { courseId: { $in: courseIds }, status: 'SUBMITTED' } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$scorePercentage' },
          totalAttempts: { $sum: 1 },
        },
      },
    ]),
    Enrollment.find({ courseId: { $in: courseIds } })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Progress.find({ courseId: { $in: courseIds }, isCompleted: true })
      .populate('studentId', 'name email')
      .populate('lessonId', 'title')
      .populate('courseId', 'title')
      .sort({ completedAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const totalEnrollments = enrollmentAgg[0]?.totalEnrollments || 0;
  const averageCompletion = Math.round(enrollmentAgg[0]?.avgCompletion || 0);
  const totalStudents = distinctStudents.length;
  const averageAssessmentScore = Math.round(assessmentAgg[0]?.avgScore || 0);

  // Combine recent activity
  const activityList = [];
  recentEnrollments.forEach((e) => {
    if (e.studentId && e.courseId) {
      activityList.push({
        id: `enr-${e._id}`,
        type: 'ENROLLMENT',
        studentName: e.studentId.name,
        courseTitle: e.courseId.title,
        timestamp: e.createdAt,
        message: `${e.studentId.name} enrolled in "${e.courseId.title}"`,
      });
    }
  });

  recentProgress.forEach((p) => {
    if (p.studentId && p.lessonId) {
      activityList.push({
        id: `prog-${p._id}`,
        type: 'LESSON_COMPLETED',
        studentName: p.studentId.name,
        courseTitle: p.courseId?.title || '',
        timestamp: p.completedAt,
        message: `${p.studentId.name} completed "${p.lessonId.title}"`,
      });
    }
  });

  activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Course performance per course
  const coursePerformance = await Enrollment.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    {
      $group: {
        _id: '$courseId',
        enrolledStudents: { $sum: 1 },
        avgProgress: { $avg: '$progressPercentage' },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
        },
      },
    },
  ]);

  const perfMap = new Map(coursePerformance.map((cp) => [cp._id.toString(), cp]));
  const courseCards = courses.slice(0, 5).map((c) => {
    const stats = perfMap.get(c._id.toString()) || { enrolledStudents: 0, avgProgress: 0, completedCount: 0 };
    return {
      courseId: c._id,
      title: c.title,
      status: c.status,
      enrolledStudents: stats.enrolledStudents,
      averageProgress: Math.round(stats.avgProgress || 0),
      completedStudents: stats.completedCount,
    };
  });

  return {
    kpis: {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalEnrollments,
      averageCompletion,
      averageAssessmentScore,
    },
    recentActivity: activityList.slice(0, 10),
    coursePerformance: courseCards,
  };
};

/**
 * Course detailed analytics
 */
const getCourseAnalytics = async (courseId, instructorId) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId }).lean();
  if (!course) {
    const err = new Error('Course not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  const [enrollments, progressRecords, assessmentAttempts, lessons] = await Promise.all([
    Enrollment.find({ courseId: course._id }).lean(),
    Progress.find({ courseId: course._id }).lean(),
    AssessmentAttempt.find({ courseId: course._id, status: 'SUBMITTED' }).lean(),
    Lesson.find({ courseId: course._id, isPublished: true }).sort({ order: 1 }).select('_id title order').lean(),
  ]);

  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED' || e.progressPercentage === 100).length;
  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE' && e.progressPercentage < 100).length;
  const avgProgress = totalEnrollments > 0 ? Math.round(enrollments.reduce((acc, e) => acc + (e.progressPercentage || 0), 0) / totalEnrollments) : 0;

  // Lesson drop-off / completion distribution
  const lessonCompletionMap = new Map();
  progressRecords.forEach((p) => {
    if (p.isCompleted && p.lessonId) {
      const lid = p.lessonId.toString();
      lessonCompletionMap.set(lid, (lessonCompletionMap.get(lid) || 0) + 1);
    }
  });

  const lessonFunnel = lessons.map((l) => {
    const count = lessonCompletionMap.get(l._id.toString()) || 0;
    const rate = totalEnrollments > 0 ? Math.round((count / totalEnrollments) * 100) : 0;
    return {
      lessonId: l._id,
      title: l.title,
      order: l.order,
      completedCount: count,
      completionRate: rate,
    };
  });

  // Assessment score metrics
  const totalAttempts = assessmentAttempts.length;
  const passedAttempts = assessmentAttempts.filter((a) => a.passed).length;
  const avgScore = totalAttempts > 0 ? Math.round(assessmentAttempts.reduce((acc, a) => acc + (a.scorePercentage || 0), 0) / totalAttempts) : 0;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  return {
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      status: course.status,
    },
    metrics: {
      totalEnrollments,
      completedEnrollments,
      activeEnrollments,
      averageProgress: avgProgress,
      assessmentPassRate: passRate,
      assessmentAverageScore: avgScore,
    },
    lessonFunnel,
  };
};

module.exports = {
  getOverviewAnalytics,
  getCourseAnalytics,
};
