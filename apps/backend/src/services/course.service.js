const mongoose = require('mongoose');
const { Course } = require('../models/course.model');
const Module = require('../models/module.model');
const { Lesson } = require('../models/lesson.model');
const { Enrollment } = require('../models/enrollment.model');
const Progress = require('../models/progress.model');

/**
 * Fetch paginated, searchable, filterable published courses
 */
const getCourses = async ({
  page = 1,
  limit = 12,
  search = '',
  category = '',
  difficulty = '',
  sort = 'newest',
  user = null,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Base query: Only PUBLISHED and non-deleted courses for students
  const query = {
    isPublished: true,
    status: 'PUBLISHED',
    isDeleted: { $ne: true },
  };

  // Keyword search
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { shortDescription: { $regex: s, $options: 'i' } },
      { category: { $regex: s, $options: 'i' } },
      { skills: { $in: [new RegExp(s, 'i')] } },
    ];
  }

  // Category filter
  if (category && category.toLowerCase() !== 'all') {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
  }

  // Difficulty filter
  if (difficulty && difficulty.toLowerCase() !== 'all') {
    query.difficulty = difficulty.toUpperCase();
  }

  // Sort order
  let sortOption = { featured: -1, publishedAt: -1, createdAt: -1 };
  if (sort === 'newest') sortOption = { publishedAt: -1, createdAt: -1 };
  if (sort === 'oldest') sortOption = { publishedAt: 1, createdAt: 1 };
  if (sort === 'longest') sortOption = { duration: -1 };
  if (sort === 'shortest') sortOption = { duration: 1 };
  if (sort === 'popular') sortOption = { enrollmentCount: -1, publishedAt: -1 };
  if (sort === 'recently_published' || sort === 'recent') sortOption = { publishedAt: -1 };

  const [items, total] = await Promise.all([
    Course.find(query)
      .populate('instructor', 'name avatar email')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Course.countDocuments(query),
  ]);

  // If user is authenticated, attach enrollment status
  let userEnrollmentsMap = {};
  if (user) {
    const enrollments = await Enrollment.find({
      studentId: user._id,
      courseId: { $in: items.map((c) => c._id) },
    }).lean();

    enrollments.forEach((e) => {
      userEnrollmentsMap[e.courseId.toString()] = e;
    });
  }

  const enrichedItems = items.map((course) => {
    const enrollment = userEnrollmentsMap[course._id.toString()];
    return {
      ...course,
      id: course._id.toString(),
      isEnrolled: !!enrollment,
      enrollmentStatus: enrollment ? enrollment.status : null,
      progressPercentage: enrollment ? enrollment.progressPercentage : 0,
    };
  });

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    items: enrichedItems,
    courses: enrichedItems,
    page: pageNum,
    limit: limitNum,
    total,
    totalCourses: total,
    totalPages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalCourses: total,
      totalPages,
    },
  };
};

/**
 * Get single published course by slug or ID with full modules & lesson outline
 * Non-admin students receive 404 for unpublished courses.
 */
const getCourseBySlug = async (slugOrId, user = null) => {
  if (!slugOrId) {
    throw new Error('COURSE_NOT_FOUND');
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
  const identifierFilter = isObjectId
    ? { $or: [{ slug: slugOrId.toLowerCase().trim() }, { _id: slugOrId }] }
    : { slug: slugOrId.toLowerCase().trim() };

  // Determine if user has privileged preview rights (Admin or Course Owning Instructor)
  const isPrivileged = user && (
    ['ADMIN', 'SUPER_ADMIN'].includes(user.role?.toUpperCase()) ||
    user.role?.toUpperCase() === 'INSTRUCTOR'
  );

  let course;
  if (isPrivileged) {
    course = await Course.findOne({
      ...identifierFilter,
      isDeleted: { $ne: true },
    })
      .populate('instructor', 'name avatar email')
      .lean();

    // If instructor is not owner and not admin, check if course is published
    if (course && course.status !== 'PUBLISHED') {
      const isOwner =
        course.instructor?._id?.toString() === user._id?.toString() ||
        course.instructor?.toString() === user._id?.toString();
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role?.toUpperCase());
      if (!isOwner && !isAdmin) {
        throw new Error('COURSE_NOT_FOUND');
      }
    }
  } else {
    course = await Course.findOne({
      ...identifierFilter,
      isPublished: true,
      status: 'PUBLISHED',
      isDeleted: { $ne: true },
    })
      .populate('instructor', 'name avatar email')
      .lean();
  }

  if (!course || course.isDeleted) {
    throw new Error('COURSE_NOT_FOUND');
  }

  // Fetch ordered modules
  const modules = await Module.find({
    courseId: course._id,
    isPublished: true,
  })
    .sort({ order: 1 })
    .lean();

  // Fetch ordered lessons for all modules
  const moduleIds = modules.map((m) => m._id);
  const lessons = await Lesson.find({
    moduleId: { $in: moduleIds },
    isPublished: true,
  })
    .sort({ order: 1 })
    .lean();

  // Check enrollment
  let isEnrolled = false;
  let enrollment = null;
  let userProgressMap = {};

  if (user) {
    enrollment = await Enrollment.findOne({
      studentId: user._id,
      courseId: course._id,
    }).lean();
    isEnrolled = !!enrollment;

    if (isEnrolled) {
      const progressRecords = await Progress.find({
        studentId: user._id,
        courseId: course._id,
      }).lean();

      progressRecords.forEach((p) => {
        userProgressMap[p.lessonId.toString()] = p;
      });
    }
  }

  // Group lessons into modules with locked/preview indicators
  const modulesWithLessons = modules.map((mod) => {
    const modLessons = lessons
      .filter((l) => l.moduleId.toString() === mod._id.toString())
      .map((lesson) => {
        const isLocked = !isEnrolled && !lesson.isPreview;
        const progress = userProgressMap[lesson._id.toString()];

        return {
          _id: lesson._id,
          title: lesson.title,
          slug: lesson.slug,
          type: lesson.type,
          order: lesson.order,
          duration: lesson.duration,
          isPreview: lesson.isPreview,
          isLocked,
          isCompleted: progress ? progress.isCompleted : false,
          lastPosition: progress ? progress.lastPosition : 0,
        };
      });

    return {
      ...mod,
      lessons: modLessons,
    };
  });

  return {
    ...course,
    modules: modulesWithLessons,
    isEnrolled,
    enrollment,
  };
};

/**
 * Get full curriculum and lesson player payload for active learning environment
 */
const getCourseCurriculum = async (courseId, user) => {
  let course;
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } }).lean();
  }
  if (!course) {
    course = await Course.findOne({ slug: courseId, isDeleted: { $ne: true } }).lean();
  }
  if (!course || !course.isPublished || course.isDeleted) {
    throw new Error('COURSE_NOT_FOUND');
  }

  const enrollment = user?._id
    ? await Enrollment.findOne({
        studentId: user._id,
        courseId: course._id,
      }).lean()
    : null;

  const isEnrolled = !!enrollment;

  // Retrieve modules & lessons
  const modules = await Module.find({ courseId: course._id, isPublished: true })
    .sort({ order: 1 })
    .lean();

  const lessons = await Lesson.find({ courseId: course._id, isPublished: true })
    .sort({ order: 1 })
    .lean();

  // Progress map
  let userProgressMap = {};
  if (isEnrolled && user?._id) {
    const progressRecords = await Progress.find({
      studentId: user._id,
      courseId: course._id,
    }).lean();

    progressRecords.forEach((p) => {
      userProgressMap[p.lessonId.toString()] = p;
    });
  }

  // Structure curriculum with security masking for locked lessons
  const curriculum = modules.map((mod) => {
    const modLessons = lessons
      .filter((l) => l.moduleId.toString() === mod._id.toString())
      .map((l) => {
        const isLocked = !isEnrolled && !l.isPreview;
        const progress = userProgressMap[l._id.toString()];

        return {
          _id: l._id,
          courseId: l.courseId || course._id,
          moduleId: l.moduleId,
          title: l.title,
          slug: l.slug,
          description: l.description,
          type: l.type,
          order: l.order,
          duration: l.duration,
          isPreview: l.isPreview,
          isLocked,
          // Content and videoUrl are hidden if lesson is locked (server-side security enforcement)
          videoUrl: isLocked ? null : l.videoUrl,
          content: isLocked ? null : l.content,
          resources: isLocked ? [] : l.resources,
          isCompleted: progress ? progress.isCompleted : false,
          lastPosition: progress ? progress.lastPosition : 0,
        };
      });

    return {
      ...mod,
      lessons: modLessons,
    };
  });

  return {
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      category: course.category,
      difficulty: course.difficulty,
    },
    isEnrolled,
    enrollment,
    curriculum,
  };
};

module.exports = {
  getCourses,
  getCourseBySlug,
  getCourseCurriculum,
};
