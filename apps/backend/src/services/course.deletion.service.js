const mongoose = require('mongoose');
const { Course } = require('../models/course.model');
const { VectorChunk } = require('../models/vectorChunk.model');
const AuditLog = require('../models/auditLog.model');

/**
 * Centralized Course Deletion Service
 * Handles authorization, hybrid soft-delete, dependency cleanup, and audit logging.
 */
class CourseDeletionService {
  /**
   * Delete course with role-based authorization
   * @param {string} courseId - ObjectId or slug of course
   * @param {object} user - Authenticated user document (req.user)
   * @param {object} options - Optional parameters (reason, req)
   */
  async deleteCourse(courseId, user, { reason = null } = {}) {
    if (!user) {
      const err = new Error('Authentication required.');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    if (!courseId || courseId === 'undefined' || courseId === 'null' || typeof courseId !== 'string' || !courseId.trim()) {
      const err = new Error('Invalid course ID.');
      err.statusCode = 400;
      err.code = 'INVALID_COURSE_ID';
      throw err;
    }

    const trimmedId = courseId.trim();

    // Query with includeDeleted: true to distinguish between non-existent and already deleted
    let course;
    if (mongoose.Types.ObjectId.isValid(trimmedId)) {
      course = await Course.findOne({ _id: trimmedId, includeDeleted: true });
    } else {
      course = await Course.findOne({ slug: trimmedId.toLowerCase(), includeDeleted: true });
    }

    if (!course || course.isDeleted === true) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      err.code = 'COURSE_NOT_FOUND';
      throw err;
    }

    // Authorization check
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isAdmin = user.role === 'ADMIN';
    const isInstructor = user.role === 'INSTRUCTOR';

    if (!isAdmin && !isSuperAdmin && !isInstructor) {
      const err = new Error('You are not authorized to delete this course.');
      err.statusCode = 403;
      err.code = 'COURSE_DELETE_FORBIDDEN';
      throw err;
    }

    if (isInstructor && !isAdmin && !isSuperAdmin) {
      const isOwner = course.instructor && course.instructor.toString() === user._id.toString();
      if (!isOwner) {
        const err = new Error('You are not authorized to delete this course.');
        err.statusCode = 403;
        err.code = 'COURSE_DELETE_FORBIDDEN';
        throw err;
      }
    }

    // 1. Mark Course as soft-deleted and archive
    course.isDeleted = true;
    course.deletedAt = new Date();
    course.deletedBy = user._id;
    course.deletionReason = reason || `Course deleted by ${user.role.toLowerCase()}`;
    course.status = 'ARCHIVED';
    course.isPublished = false;
    await course.save();

    // 2. AI / RAG Cleanup: Delete indexed vector chunks to prevent recommendations/citations
    try {
      if (VectorChunk) {
        await VectorChunk.deleteMany({ courseId: course._id });
      }
    } catch (e) {
      console.warn('VectorChunk cleanup non-critical error:', e.message);
    }

    // 3. NOTE: Student certificates are strictly preserved!
    // Historical verifiable credentials stay intact for student portfolios.

    // 4. Record Audit Log
    try {
      await AuditLog.create({
        action: 'COURSE_DELETED',
        actorId: user._id,
        actorRole: user.role,
        resourceType: 'COURSE',
        resourceId: course._id,
        details: `Course "${course.title}" was deleted by ${user.role}`,
        metadata: {
          title: course.title,
          slug: course.slug,
          deletedAt: new Date(),
          deletedBy: user._id,
          deletionReason: course.deletionReason,
        },
      });
    } catch (e) {
      console.warn('AuditLog creation non-critical error:', e.message);
    }

    return {
      success: true,
      message: 'Course deleted successfully.',
      data: {
        deletedCourseId: course._id,
        title: course.title,
      },
    };
  }
}

module.exports = new CourseDeletionService();
