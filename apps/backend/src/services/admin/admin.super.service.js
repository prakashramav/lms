const { User } = require('../../models/user.model');
const { Course } = require('../../models/course.model');
const Category = require('../../models/category.model');
const { Report } = require('../../models/report.model');
const { Announcement } = require('../../models/announcement.model');
const FeatureFlag = require('../../models/featureFlag.model');
const PlatformSetting = require('../../models/platformSetting.model');
const adminAuditService = require('./admin.audit.service');

class AdminSuperService {
  // ==========================================
  // 1. ADMIN USER MANAGEMENT (SUPER_ADMIN ONLY)
  // ==========================================

  /**
   * List all admin and super-admin accounts
   */
  async getAdmins() {
    return User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } })
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
      .sort({ role: 1, createdAt: -1 })
      .lean();
  }

  /**
   * Create a new administrator account
   */
  async createAdmin({ name, email, password, role = 'ADMIN', permissions = [] }, superAdmin, req = null) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 400;
      throw err;
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      permissions: role === 'SUPER_ADMIN' ? [] : permissions,
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    await adminAuditService.recordAction({
      actor: superAdmin,
      action: 'ADMIN_CREATED',
      resourceType: 'ADMIN',
      resourceId: admin._id,
      metadata: { email: admin.email, role: admin.role, permissions },
      req,
    });

    return admin;
  }

  /**
   * Update admin permissions
   */
  async updateAdminPermissions(adminId, { permissions, role }, superAdmin, req = null) {
    const admin = await User.findById(adminId);
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      const err = new Error('Administrator account not found');
      err.statusCode = 404;
      throw err;
    }

    if (permissions !== undefined) admin.permissions = permissions;
    if (role && ['ADMIN', 'SUPER_ADMIN'].includes(role)) admin.role = role;

    await admin.save();

    await adminAuditService.recordAction({
      actor: superAdmin,
      action: 'ADMIN_PERMISSIONS_UPDATED',
      resourceType: 'ADMIN',
      resourceId: admin._id,
      metadata: { targetEmail: admin.email, permissions, role },
      req,
    });

    return admin;
  }

  /**
   * Disable/Deactivate admin account
   */
  async disableAdmin(adminId, superAdmin, req = null) {
    if (adminId.toString() === superAdmin._id.toString()) {
      const err = new Error('Cannot disable your own Super Administrator account');
      err.statusCode = 400;
      throw err;
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      const err = new Error('Administrator account not found');
      err.statusCode = 404;
      throw err;
    }

    admin.status = 'DISABLED';
    await admin.save();

    await adminAuditService.recordAction({
      actor: superAdmin,
      action: 'ADMIN_DISABLED',
      resourceType: 'ADMIN',
      resourceId: admin._id,
      metadata: { targetEmail: admin.email },
      req,
    });

    return admin;
  }

  // ==========================================
  // 2. FEATURE FLAGS
  // ==========================================

  async getFeatureFlags() {
    return FeatureFlag.find().sort({ key: 1 }).lean();
  }

  async updateFeatureFlag(key, { enabled, description }, adminUser, req = null) {
    let flag = await FeatureFlag.findOne({ key: key.toUpperCase() });
    if (!flag) {
      flag = new FeatureFlag({
        key: key.toUpperCase(),
        description: description || `Feature flag ${key}`,
        enabled: Boolean(enabled),
        updatedBy: adminUser._id,
      });
    } else {
      if (enabled !== undefined) flag.enabled = Boolean(enabled);
      if (description) flag.description = description;
      flag.updatedBy = adminUser._id;
    }

    await flag.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'FEATURE_FLAG_UPDATED',
      resourceType: 'FEATURE_FLAG',
      resourceId: flag._id,
      metadata: { key: flag.key, enabled: flag.enabled },
      req,
    });

    return flag;
  }

  // ==========================================
  // 3. CATEGORIES MANAGEMENT
  // ==========================================

  async getCategories() {
    const categories = await Category.find().sort({ name: 1 }).lean();
    // Count active courses per category
    const counts = await Course.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toLowerCase()] = c.count;
    });

    return categories.map((cat) => ({
      ...cat,
      coursesCount: countMap[cat.name.toLowerCase()] || 0,
    }));
  }

  async createCategory({ name, slug, description, skills = [] }, adminUser, req = null) {
    const formattedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await Category.findOne({
      $or: [{ name: new RegExp(`^${name.trim()}$`, 'i') }, { slug: formattedSlug }],
    });

    if (existing) {
      const err = new Error('Category with this name or slug already exists');
      err.statusCode = 400;
      throw err;
    }

    const category = await Category.create({
      name: name.trim(),
      slug: formattedSlug,
      description: description || '',
      skills,
      createdBy: adminUser._id,
    });

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'CATEGORY_CREATED',
      resourceType: 'CATEGORY',
      resourceId: category._id,
      metadata: { name: category.name, slug: category.slug },
      req,
    });

    return category;
  }

  async archiveCategory(categoryId, adminUser, req = null) {
    const category = await Category.findById(categoryId);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    // Safety check: prevent archiving/deleting if courses are currently using this category
    const activeCoursesCount = await Course.countDocuments({
      category: new RegExp(`^${category.name}$`, 'i'),
      status: { $ne: 'ARCHIVED' },
    });

    if (activeCoursesCount > 0) {
      const err = new Error(
        `Cannot archive category. It is currently utilized by ${activeCoursesCount} active course(s).`
      );
      err.statusCode = 400;
      throw err;
    }

    category.status = 'ARCHIVED';
    category.updatedBy = adminUser._id;
    await category.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'CATEGORY_ARCHIVED',
      resourceType: 'CATEGORY',
      resourceId: category._id,
      metadata: { name: category.name },
      req,
    });

    return category;
  }

  // ==========================================
  // 4. REPORTS & CONTENT MODERATION QUEUE
  // ==========================================

  async getReports({ page = 1, limit = 20, status, targetType } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (targetType) query.targetType = targetType.toUpperCase();

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporterId', 'name email role')
        .populate('assignedTo', 'name email')
        .populate('resolution.resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(query),
    ]);

    return {
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getReportById(reportId) {
    const report = await Report.findById(reportId)
      .populate('reporterId', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .lean();

    if (!report) {
      const err = new Error('Report not found');
      err.statusCode = 404;
      throw err;
    }
    return report;
  }

  async updateReport(reportId, { status, assignedTo, resolutionNotes, actionTaken }, adminUser, req = null) {
    const report = await Report.findById(reportId);
    if (!report) {
      const err = new Error('Report not found');
      err.statusCode = 404;
      throw err;
    }

    if (status) report.status = status;
    if (assignedTo !== undefined) report.assignedTo = assignedTo || null;

    if (status === 'RESOLVED' || status === 'DISMISSED') {
      report.resolution = {
        actionTaken: actionTaken || (status === 'RESOLVED' ? 'Action executed' : 'Dismissed after review'),
        notes: resolutionNotes || '',
        resolvedAt: new Date(),
        resolvedBy: adminUser._id,
      };
    }

    await report.save();

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'REPORT_UPDATED',
      resourceType: 'REPORT',
      resourceId: report._id,
      metadata: { status: report.status, actionTaken },
      req,
    });

    return report;
  }

  // ==========================================
  // 5. ANNOUNCEMENTS
  // ==========================================

  async getAnnouncements({ page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find()
        .populate('createdBy', 'name email role')
        .populate('courseId', 'title slug')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Announcement.countDocuments(),
    ]);

    return {
      announcements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async createAnnouncement({ title, message, audience, courseId, priority }, adminUser, req = null) {
    const announcement = await Announcement.create({
      title,
      message,
      audience: audience || 'ALL',
      courseId: courseId || null,
      priority: priority || 'NORMAL',
      createdBy: adminUser._id,
      status: 'PUBLISHED',
    });

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'ANNOUNCEMENT_CREATED',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcement._id,
      metadata: { title, audience },
      req,
    });

    return announcement;
  }

  // ==========================================
  // 6. PLATFORM SETTINGS
  // ==========================================

  async getSettings() {
    const settings = await PlatformSetting.find().lean();
    const grouped = {};
    settings.forEach((s) => {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    });

    // Provide default platform values if not set
    return {
      GENERAL: {
        platformName: 'ApexEd Enterprise LMS',
        supportEmail: 'support@example.com',
        maintenanceMode: false,
        ...(grouped.GENERAL || {}),
      },
      COURSE_POLICIES: {
        requireAdminApprovalToPublish: true,
        allowInstructorCourseDeletion: false,
        ...(grouped.COURSE_POLICIES || {}),
      },
      AI_POLICIES: {
        aiTutorEnabled: true,
        maxTokensPerQuery: 2048,
        rateLimitQueriesPerMinute: 20,
        ...(grouped.AI_POLICIES || {}),
      },
      SECURITY: {
        mfaEnforcedForAdmins: false,
        sessionTimeoutMinutes: 60,
        ...(grouped.SECURITY || {}),
      },
    };
  }

  async updateSettings(group, settingsObj, adminUser, req = null) {
    const operations = Object.entries(settingsObj).map(([key, value]) => ({
      updateOne: {
        filter: { key, group: group.toUpperCase() },
        update: {
          $set: {
            value,
            updatedBy: adminUser._id,
          },
        },
        upsert: true,
      },
    }));

    await PlatformSetting.bulkWrite(operations);

    await adminAuditService.recordAction({
      actor: adminUser,
      action: 'PLATFORM_SETTINGS_UPDATED',
      resourceType: 'SETTINGS',
      resourceId: null,
      metadata: { group, keys: Object.keys(settingsObj) },
      req,
    });

    return this.getSettings();
  }
}

module.exports = new AdminSuperService();
