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

  // Base query: Only PUBLISHED courses for students
  const query = {
    isPublished: true,
    status: 'PUBLISHED',
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
  let sortOption = { featured: -1, createdAt: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'longest') sortOption = { duration: -1 };
  if (sort === 'shortest') sortOption = { duration: 1 };

  const [items, total] = await Promise.all([
    Course.find(query)
      .populate('instructor', 'name avatar')
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
      isEnrolled: !!enrollment,
      enrollmentStatus: enrollment ? enrollment.status : null,
      progressPercentage: enrollment ? enrollment.progressPercentage : 0,
    };
  });

  return {
    items: enrichedItems,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Get single published course by slug with full modules & lesson outline
 */
const getCourseBySlug = async (slug, user = null) => {
  const course = await Course.findOne({
    slug: slug.toLowerCase().trim(),
    isPublished: true,
    status: 'PUBLISHED',
  })
    .populate('instructor', 'name avatar email')
    .lean();

  if (!course) {
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
    course = await Course.findById(courseId).lean();
  }
  if (!course) {
    course = await Course.findOne({ slug: courseId }).lean();
  }
  if (!course || !course.isPublished) {
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
