const Bookmark = require('../models/bookmark.model');
const { Lesson } = require('../models/lesson.model');

/**
 * Toggle bookmark for student
 */
const toggleBookmark = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND');
  }

  const existing = await Bookmark.findOne({ studentId, lessonId });
  if (existing) {
    await Bookmark.deleteOne({ _id: existing._id });
    return { bookmarked: false };
  }

  await Bookmark.create({ studentId, lessonId });
  return { bookmarked: true };
};

/**
 * Get all bookmarks for student
 */
const getBookmarks = async (studentId) => {
  return Bookmark.find({ studentId })
    .populate({
      path: 'lessonId',
      select: 'title slug type duration courseId moduleId',
      populate: { path: 'courseId', select: 'title slug' },
    })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Remove bookmark
 */
const removeBookmark = async (studentId, lessonId) => {
  await Bookmark.findOneAndDelete({ studentId, lessonId });
  return { bookmarked: false };
};

module.exports = {
  toggleBookmark,
  getBookmarks,
  removeBookmark,
};
