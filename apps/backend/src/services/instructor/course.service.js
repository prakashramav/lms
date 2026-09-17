const mongoose = require('mongoose');
const { Course } = require('../../models/course.model');
const Module = require('../../models/module.model');
const { Lesson } = require('../../models/lesson.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const Resource = require('../../models/resource.model');
const { logAction } = require('../audit.service');

/**
 * Generate URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * List instructor's own courses with filters & metrics
 */
const getInstructorCourses = async (instructorId, {
  page = 1,
  limit = 12,
  search = '',
  status = 'all',
  category = 'all',
  sort = 'newest',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = { instructor: instructorId };

  if (status && status !== 'all') {
    query.status = status.toUpperCase();
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { shortDescription: { $regex: term, $options: 'i' } },
      { slug: { $regex: term, $options: 'i' } },
      { skills: { $regex: term, $options: 'i' } },
    ];
  }

  let sortCriteria = { updatedAt: -1 };
  if (sort === 'oldest') sortCriteria = { createdAt: 1 };
  if (sort === 'title') sortCriteria = { title: 1 };

  const [courses, total] = await Promise.all([
    Course.find(query).sort(sortCriteria).skip(skip).limit(limitNum).lean(),
    Course.countDocuments(query),
  ]);

  // Augment courses with live metrics (modules count, lessons count, students enrolled)
  const courseIds = courses.map((c) => c._id);

  const [moduleCounts, lessonCounts, enrollmentStats] = await Promise.all([
    Module.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
    Lesson.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
    Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: '$courseId',
          studentCount: { $sum: 1 },
          avgCompletion: { $avg: '$progressPercentage' },
        },
      },
    ]),
  ]);

  const moduleMap = new Map(moduleCounts.map((m) => [m._id.toString(), m.count]));
  const lessonMap = new Map(lessonCounts.map((l) => [l._id.toString(), l.count]));
  const enrollmentMap = new Map(enrollmentStats.map((e) => [e._id.toString(), e]));

  const enrichedCourses = courses.map((c) => {
    const cid = c._id.toString();
    const enr = enrollmentMap.get(cid) || { studentCount: 0, avgCompletion: 0 };
    return {
      ...c,
      totalModules: moduleMap.get(cid) || 0,
      totalLessons: lessonMap.get(cid) || 0,
      totalStudents: enr.studentCount || 0,
      averageCompletion: Math.round(enr.avgCompletion || 0),
    };
  });

  return {
    items: enrichedCourses,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Create a new course authored by the instructor
 */
const createCourse = async (instructorId, data) => {
  const {
    title,
    slug,
    shortDescription,
    description,
    category,
    difficulty = 'BEGINNER',
    skills = [],
    language = 'English',
    duration = '10 hours',
    thumbnail,
    banner,
    requirements = [],
    learningOutcomes = [],
    pricingType = 'FREE',
  } = data;

  if (!title || !shortDescription || !description || !category) {
    throw new Error('Title, short description, description, and category are required.');
  }

  // Generate or sanitize slug
  const finalSlug = slug ? slugify(slug) : slugify(title);

  // Check unique slug
  const existing = await Course.findOne({ slug: finalSlug });
  if (existing) {
    const error = new Error(`A course with slug "${finalSlug}" already exists. Please provide a unique slug.`);
    error.statusCode = 400;
    throw error;
  }

  const course = await Course.create({
    title,
    slug: finalSlug,
    shortDescription,
    description,
    category,
    difficulty,
    skills: Array.isArray(skills) ? skills : [],
    language,
    duration,
    thumbnail: thumbnail || '/images/courses/default-thumbnail.jpg',
    banner: banner || null,
    requirements: Array.isArray(requirements) ? requirements : [],
    learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
    pricingType,
    status: 'DRAFT',
    isPublished: false,
    instructor: instructorId,
    version: 1,
  });

  await logAction({
    actorId: instructorId,
    action: 'COURSE_CREATED',
    resourceType: 'COURSE',
    resourceId: course._id,
    metadata: { title: course.title, slug: course.slug },
  });

  return course;
};

/**
 * Get full course structure for editor
 */
const getCourseDetail = async (courseId, instructorId) => {
  let course = null;
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    course = await Course.findById(courseId);
  } else {
    course = await Course.findOne({ slug: courseId });
  }

  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch modules and lessons
  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
  const moduleIds = modules.map((m) => m._id);

  const [lessons, resources, studentCount] = await Promise.all([
    Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean(),
    Resource.find({ courseId: course._id }).sort({ createdAt: -1 }).lean(),
    Enrollment.countDocuments({ courseId: course._id }),
  ]);

  const lessonMap = new Map();
  lessons.forEach((l) => {
    const mid = l.moduleId.toString();
    if (!lessonMap.has(mid)) lessonMap.set(mid, []);
    lessonMap.get(mid).push(l);
  });

  const structuredModules = modules.map((m) => ({
    ...m,
    lessons: lessonMap.get(m._id.toString()) || [],
  }));

  return {
    course,
    modules: structuredModules,
    resources,
    metrics: {
      studentCount,
      moduleCount: modules.length,
      lessonCount: lessons.length,
    },
  };
};

/**
 * Update course metadata
 */
const updateCourse = async (courseId, instructorId, updateData) => {
  let course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  // If slug is changed, ensure uniqueness
  if (updateData.slug && updateData.slug !== course.slug) {
    const safeSlug = slugify(updateData.slug);
    const existing = await Course.findOne({ slug: safeSlug, _id: { $ne: course._id } });
    if (existing) {
      const error = new Error(`A course with slug "${safeSlug}" already exists.`);
      error.statusCode = 400;
      throw error;
    }
    course.slug = safeSlug;
  }

  const allowedFields = [
    'title',
    'shortDescription',
    'description',
    'category',
    'difficulty',
    'skills',
    'language',
    'duration',
    'thumbnail',
    'banner',
    'requirements',
    'learningOutcomes',
    'pricingType',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      course[field] = updateData[field];
    }
  });

  course.version = (course.version || 1) + 1;
  await course.save();

  await logAction({
    actorId: instructorId,
    action: 'COURSE_UPDATED',
    resourceType: 'COURSE',
    resourceId: course._id,
    metadata: { title: course.title, version: course.version },
  });

  return course;
};

/**
 * Publish course with comprehensive validation checklist
 */
const publishCourse = async (courseId, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  // Publishing validation checklist
  const errors = [];
  if (!course.title || course.title.trim().length < 5) {
    errors.push('Course title must be at least 5 characters long.');
  }
  if (!course.shortDescription || course.shortDescription.trim().length < 20) {
    errors.push('Short description must be at least 20 characters long.');
  }
  if (!course.description || course.description.trim().length < 50) {
    errors.push('Full description must be at least 50 characters long.');
  }

  const modules = await Module.find({ courseId: course._id });
  if (modules.length === 0) {
    errors.push('Course must have at least one module before publishing.');
  }

  const lessons = await Lesson.find({ courseId: course._id, isPublished: true });
  if (lessons.length === 0) {
    errors.push('Course must have at least one published lesson before publishing.');
  }

  if (errors.length > 0) {
    const err = new Error(`Publishing validation failed: ${errors.join(' ')}`);
    err.statusCode = 400;
    err.validationErrors = errors;
    throw err;
  }

  course.status = 'PUBLISHED';
  course.isPublished = true;
  course.publishedAt = new Date();
  course.publishedBy = instructorId;
  course.version = (course.version || 1) + 1;
  await course.save();

  await logAction({
    actorId: instructorId,
    action: 'COURSE_PUBLISHED',
    resourceType: 'COURSE',
    resourceId: course._id,
    metadata: { title: course.title, publishedAt: course.publishedAt },
  });

  return course;
};

/**
 * Unpublish course (retains student enrollment/progress records)
 */
const unpublishCourse = async (courseId, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  course.status = 'DRAFT';
  course.isPublished = false;
  await course.save();

  await logAction({
    actorId: instructorId,
    action: 'COURSE_UNPUBLISHED',
    resourceType: 'COURSE',
    resourceId: course._id,
    metadata: { title: course.title },
  });

  return course;
};

/**
 * Archive / soft-delete course
 */
const archiveCourse = async (courseId, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  course.status = 'ARCHIVED';
  course.isPublished = false;
  await course.save();

  await logAction({
    actorId: instructorId,
    action: 'COURSE_ARCHIVED',
    resourceType: 'COURSE',
    resourceId: course._id,
    metadata: { title: course.title },
  });

  return course;
};

/**
 * Duplicate a course with its modules and lessons
 */
const duplicateCourse = async (courseId, instructorId) => {
  const original = await Course.findById(courseId);
  if (!original) {
    const err = new Error('Original course not found.');
    err.statusCode = 404;
    throw err;
  }

  if (original.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  const newTitle = `${original.title} (Copy)`;
  let newSlug = slugify(newTitle);
  let count = 1;
  while (await Course.findOne({ slug: newSlug })) {
    newSlug = `${slugify(newTitle)}-${count++}`;
  }

  const duplicatedCourse = await Course.create({
    title: newTitle,
    slug: newSlug,
    shortDescription: original.shortDescription,
    description: original.description,
    category: original.category,
    difficulty: original.difficulty,
    skills: [...original.skills],
    language: original.language,
    duration: original.duration,
    thumbnail: original.thumbnail,
    banner: original.banner,
    requirements: [...original.requirements],
    learningOutcomes: [...original.learningOutcomes],
    pricingType: original.pricingType,
    status: 'DRAFT',
    isPublished: false,
    instructor: instructorId,
    version: 1,
  });

  // Duplicate modules and lessons
  const modules = await Module.find({ courseId: original._id }).sort({ order: 1 });
  for (const mod of modules) {
    const newMod = await Module.create({
      courseId: duplicatedCourse._id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      isPublished: mod.isPublished,
    });

    const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
    for (const les of lessons) {
      await Lesson.create({
        courseId: duplicatedCourse._id,
        moduleId: newMod._id,
        title: les.title,
        slug: `${les.slug}-copy`,
        description: les.description,
        type: les.type,
        order: les.order,
        duration: les.duration,
        videoUrl: les.videoUrl,
        content: les.content,
        resources: [...les.resources],
        isPreview: les.isPreview,
        isPublished: les.isPublished,
      });
    }
  }

  await logAction({
    actorId: instructorId,
    action: 'COURSE_DUPLICATED',
    resourceType: 'COURSE',
    resourceId: duplicatedCourse._id,
    metadata: { sourceCourseId: original._id, newTitle },
  });

  return duplicatedCourse;
};

// ==========================================
// MODULE & LESSON OPERATIONS
// ==========================================

/**
 * Add a module to course
 */
const addModule = async (courseId, instructorId, { title, description = '', order }) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }
  if (course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  let finalOrder = order;
  if (!finalOrder) {
    const lastModule = await Module.findOne({ courseId }).sort({ order: -1 });
    finalOrder = lastModule ? lastModule.order + 1 : 1;
  }

  const moduleDoc = await Module.create({
    courseId,
    title,
    description,
    order: finalOrder,
    isPublished: true,
  });

  await logAction({
    actorId: instructorId,
    action: 'MODULE_CREATED',
    resourceType: 'MODULE',
    resourceId: moduleDoc._id,
    metadata: { courseId, title },
  });

  return moduleDoc;
};

/**
 * Update module
 */
const updateModule = async (moduleId, instructorId, updateData) => {
  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    const err = new Error('Module not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(moduleDoc.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  if (updateData.title) moduleDoc.title = updateData.title;
  if (updateData.description !== undefined) moduleDoc.description = updateData.description;
  if (updateData.isPublished !== undefined) moduleDoc.isPublished = updateData.isPublished;

  await moduleDoc.save();
  return moduleDoc;
};

/**
 * Delete module and its lessons
 */
const deleteModule = async (moduleId, instructorId) => {
  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    const err = new Error('Module not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(moduleDoc.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  // Delete lessons under this module
  await Lesson.deleteMany({ moduleId: moduleDoc._id });
  await Module.findByIdAndDelete(moduleDoc._id);

  await logAction({
    actorId: instructorId,
    action: 'MODULE_DELETED',
    resourceType: 'MODULE',
    resourceId: moduleDoc._id,
    metadata: { courseId: course._id },
  });

  return { success: true, message: 'Module and associated lessons deleted.' };
};

/**
 * Reorder modules in course
 */
const reorderModules = async (courseId, instructorId, orderedModuleIds) => {
  const course = await Course.findById(courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  if (!Array.isArray(orderedModuleIds) || orderedModuleIds.length === 0) {
    throw new Error('Module IDs array required for reordering.');
  }

  const updatePromises = orderedModuleIds.map((id, index) =>
    Module.findOneAndUpdate(
      { _id: id, courseId },
      { $set: { order: index + 1 } },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  await logAction({
    actorId: instructorId,
    action: 'MODULES_REORDERED',
    resourceType: 'COURSE',
    resourceId: courseId,
    metadata: { count: orderedModuleIds.length },
  });

  return { success: true, message: 'Modules reordered successfully.' };
};

/**
 * Add a lesson to module
 */
const addLesson = async (moduleId, instructorId, lessonData) => {
  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    const err = new Error('Module not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(moduleDoc.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  const {
    title,
    slug,
    description = '',
    type = 'VIDEO',
    duration = 15,
    videoUrl = null,
    content = '',
    resources = [],
    isPreview = false,
    isPublished = true,
    order,
  } = lessonData;

  if (!title) {
    throw new Error('Lesson title is required.');
  }

  let finalOrder = order;
  if (!finalOrder) {
    const lastLesson = await Lesson.findOne({ moduleId }).sort({ order: -1 });
    finalOrder = lastLesson ? lastLesson.order + 1 : 1;
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);

  const lesson = await Lesson.create({
    courseId: course._id,
    moduleId,
    title,
    slug: finalSlug,
    description,
    type,
    order: finalOrder,
    duration,
    videoUrl,
    content,
    resources: Array.isArray(resources) ? resources : [],
    isPreview: !!isPreview,
    isPublished: isPublished !== undefined ? isPublished : true,
  });

  await logAction({
    actorId: instructorId,
    action: 'LESSON_CREATED',
    resourceType: 'LESSON',
    resourceId: lesson._id,
    metadata: { courseId: course._id, moduleId, title },
  });

  return lesson;
};

/**
 * Update lesson
 */
const updateLesson = async (lessonId, instructorId, updateData) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    const err = new Error('Lesson not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(lesson.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  const allowed = [
    'title',
    'slug',
    'description',
    'type',
    'duration',
    'videoUrl',
    'content',
    'resources',
    'isPreview',
    'isPublished',
    'order',
  ];

  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'slug') {
        lesson.slug = slugify(updateData.slug);
      } else {
        lesson[field] = updateData[field];
      }
    }
  });

  await lesson.save();

  await logAction({
    actorId: instructorId,
    action: 'LESSON_UPDATED',
    resourceType: 'LESSON',
    resourceId: lesson._id,
    metadata: { title: lesson.title },
  });

  return lesson;
};

/**
 * Delete lesson
 */
const deleteLesson = async (lessonId, instructorId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    const err = new Error('Lesson not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(lesson.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  await Lesson.findByIdAndDelete(lesson._id);

  await logAction({
    actorId: instructorId,
    action: 'LESSON_DELETED',
    resourceType: 'LESSON',
    resourceId: lesson._id,
    metadata: { courseId: course._id, title: lesson.title },
  });

  return { success: true, message: 'Lesson deleted.' };
};

/**
 * Reorder lessons within a module
 */
const reorderLessons = async (moduleId, instructorId, orderedLessonIds) => {
  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    const err = new Error('Module not found.');
    err.statusCode = 404;
    throw err;
  }

  const course = await Course.findById(moduleDoc.courseId);
  if (!course || course.instructor.toString() !== instructorId.toString()) {
    const err = new Error('Forbidden. You do not own this course.');
    err.statusCode = 403;
    throw err;
  }

  if (!Array.isArray(orderedLessonIds) || orderedLessonIds.length === 0) {
    throw new Error('Lesson IDs array required for reordering.');
  }

  const updatePromises = orderedLessonIds.map((id, index) =>
    Lesson.findOneAndUpdate(
      { _id: id, moduleId },
      { $set: { order: index + 1 } },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  await logAction({
    actorId: instructorId,
    action: 'LESSONS_REORDERED',
    resourceType: 'MODULE',
    resourceId: moduleId,
    metadata: { count: orderedLessonIds.length },
  });

  return { success: true, message: 'Lessons reordered successfully.' };
};

module.exports = {
  getInstructorCourses,
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
};
