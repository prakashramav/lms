const bookmarkService = require('../services/bookmark.service');

/**
 * Toggle bookmark
 * @route POST /api/v1/bookmarks/:lessonId
 */
const toggle = async (req, res, next) => {
  try {
    const result = await bookmarkService.toggleBookmark(req.user._id, req.params.lessonId);
    res.status(200).json({
      success: true,
      message: result.bookmarked ? 'Lesson bookmarked.' : 'Bookmark removed.',
      data: result,
    });
  } catch (error) {
    if (error.message === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }
    next(error);
  }
};

/**
 * Get all bookmarks
 * @route GET /api/v1/bookmarks
 */
const list = async (req, res, next) => {
  try {
    const bookmarks = await bookmarkService.getBookmarks(req.user._id);
    res.status(200).json({
      success: true,
      data: { bookmarks },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bookmark
 * @route DELETE /api/v1/bookmarks/:lessonId
 */
const remove = async (req, res, next) => {
  try {
    const result = await bookmarkService.removeBookmark(req.user._id, req.params.lessonId);
    res.status(200).json({
      success: true,
      message: 'Bookmark removed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggle,
  list,
  remove,
};
