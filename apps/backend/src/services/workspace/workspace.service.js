const { Workspace } = require('../../models/workspace.model');
const { Lesson } = require('../../models/lesson.model');
const { Assignment } = require('../../models/assignment.model');
const { Enrollment } = require('../../models/enrollment.model');
const { templateRegistry } = require('./templateRegistry');
const { storageManager } = require('./storageManager');
const { processManager } = require('./processManager');
const { testRunner } = require('./testRunner');

class WorkspaceService {
  /**
   * Provision or resume an isolated learning workspace
   */
  async getOrCreateWorkspace({
    userId,
    userRole = 'STUDENT',
    courseId = null,
    moduleId = null,
    lessonId = null,
    assignmentId = null,
    templateId = 'react',
    hardware = 'cpu',
    isInstructorPreview = false,
  }) {
    // 1. Enrollment check: Students must be enrolled in course
    if (courseId && userRole === 'STUDENT' && !isInstructorPreview) {
      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId,
        status: { $in: ['ACTIVE', 'COMPLETED'] },
      });
      if (!enrollment) {
        throw new Error('Forbidden: You must be enrolled in this course to launch a workspace');
      }
    }

    // 2. Resolve template definition & custom starter files
    let resolvedTemplateId = templateId;
    let starterFiles = [];
    let customTests = [];
    let workspaceType = 'CLOUD_IDE';

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (lesson?.workspace?.enabled) {
        resolvedTemplateId = lesson.workspace.templateId || resolvedTemplateId;
        workspaceType = lesson.workspace.type || workspaceType;
        if (lesson.workspace.starterFiles && lesson.workspace.starterFiles.length > 0) {
          starterFiles = lesson.workspace.starterFiles;
        }
        if (lesson.workspace.tests && lesson.workspace.tests.length > 0) {
          customTests = lesson.workspace.tests;
        }
      }
    } else if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId);
      if (assignment?.workspace?.enabled) {
        resolvedTemplateId = assignment.workspace.templateId || resolvedTemplateId;
        workspaceType = assignment.workspace.type || workspaceType;
        if (assignment.workspace.starterFiles && assignment.workspace.starterFiles.length > 0) {
          starterFiles = assignment.workspace.starterFiles;
        }
        if (assignment.workspace.tests && assignment.workspace.tests.length > 0) {
          customTests = assignment.workspace.tests;
        }
      }
    }

    const template = templateRegistry.getTemplate(resolvedTemplateId);
    if (!template) {
      throw new Error(`Workspace template "${resolvedTemplateId}" is not registered.`);
    }

    // Fall back to template starter files if lesson didn't override
    if (starterFiles.length === 0) {
      starterFiles = template.starterFiles || [];
    }

    // 3. Find existing active workspace for this context
    let workspace = await Workspace.findOne({
      userId,
      courseId,
      lessonId,
      assignmentId,
      isInstructorPreview,
      status: { $ne: 'DELETED' },
    });

    if (!workspace) {
      workspace = await Workspace.create({
        userId,
        courseId,
        moduleId,
        lessonId,
        assignmentId,
        templateId: resolvedTemplateId,
        templateVersion: '1.0',
        workspaceType: template.category || workspaceType,
        status: 'CREATING',
        resourceProfile: template.resourceProfile || 'STANDARD',
        hardware: hardware || template.hardware || 'cpu',
        isInstructorPreview,
        lastActiveAt: new Date(),
      });

      // Initialize persistent volume files
      const { storagePath } = await storageManager.initializeWorkspaceFiles(
        userId,
        workspace._id,
        starterFiles
      );

      const previewUrl = template.previewPort
        ? `/api/v1/workspaces/${workspace._id}/preview`
        : null;

      workspace.storagePath = storagePath;
      workspace.previewUrl = previewUrl;
      workspace.workspaceUrl = `/workspaces/${workspace._id}`;
      workspace.status = 'RUNNING';
      await workspace.save();
    } else {
      // Resume / touch existing workspace
      if (workspace.status === 'STOPPED' || workspace.status === 'PAUSED') {
        workspace.status = 'RUNNING';
      }
      workspace.lastActiveAt = new Date();
      await workspace.save();
    }

    return {
      workspace,
      template,
    };
  }

  /**
   * Get workspace by ID with strict ownership validation
   */
  async getWorkspaceById(workspaceId, userId, userRole = 'STUDENT') {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || workspace.status === 'DELETED') {
      throw new Error('Workspace not found');
    }

    // IDOR Protection: Student can only view their own workspace; Admin / SuperAdmin can inspect all
    const isOwner = workspace.userId.toString() === userId.toString();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }

    const template = templateRegistry.getTemplate(workspace.templateId);
    return { workspace, template };
  }

  /**
   * Start or resume workspace
   */
  async startWorkspace(workspaceId, userId, userRole) {
    const { workspace } = await this.getWorkspaceById(workspaceId, userId, userRole);
    workspace.status = 'RUNNING';
    workspace.lastActiveAt = new Date();
    await workspace.save();
    return workspace;
  }

  /**
   * Stop workspace (preserves persistent files)
   */
  async stopWorkspace(workspaceId, userId, userRole) {
    const { workspace } = await this.getWorkspaceById(workspaceId, userId, userRole);
    processManager.terminateWorkspaceProcess(workspaceId);
    workspace.status = 'STOPPED';
    workspace.lastActiveAt = new Date();
    await workspace.save();
    return workspace;
  }

  /**
   * Restart workspace
   */
  async restartWorkspace(workspaceId, userId, userRole) {
    const { workspace } = await this.getWorkspaceById(workspaceId, userId, userRole);
    processManager.terminateWorkspaceProcess(workspaceId);
    workspace.status = 'RUNNING';
    workspace.lastActiveAt = new Date();
    await workspace.save();
    return workspace;
  }

  /**
   * Reset workspace to initial template files
   */
  async resetWorkspace(workspaceId, userId, userRole) {
    const { workspace, template } = await this.getWorkspaceById(workspaceId, userId, userRole);
    processManager.terminateWorkspaceProcess(workspaceId);

    // Fetch original starter files
    let starterFiles = template?.starterFiles || [];
    if (workspace.lessonId) {
      const lesson = await Lesson.findById(workspace.lessonId);
      if (lesson?.workspace?.starterFiles?.length > 0) {
        starterFiles = lesson.workspace.starterFiles;
      }
    }

    await storageManager.purgeWorkspace(userId, workspaceId);
    await storageManager.initializeWorkspaceFiles(userId, workspaceId, starterFiles);

    workspace.status = 'RUNNING';
    workspace.lastActiveAt = new Date();
    await workspace.save();

    return {
      success: true,
      message: 'Workspace cleanly reset to starter template state.',
      workspace,
    };
  }

  /**
   * Delete workspace and remove disk volume
   */
  async deleteWorkspace(workspaceId, userId, userRole) {
    const { workspace } = await this.getWorkspaceById(workspaceId, userId, userRole);
    processManager.terminateWorkspaceProcess(workspaceId);
    await storageManager.purgeWorkspace(userId, workspaceId);

    workspace.status = 'DELETED';
    await workspace.save();

    return { success: true, message: 'Workspace deleted.' };
  }

  /**
   * Auto-stop inactive workspaces (Inactivity Policy)
   */
  async autoStopInactiveWorkspaces() {
    const now = new Date();
    const runningWorkspaces = await Workspace.find({ status: 'RUNNING' });
    let stoppedCount = 0;

    for (const ws of runningWorkspaces) {
      const timeoutMs = (ws.inactivityTimeoutMinutes || 30) * 60 * 1000;
      const lastActive = ws.lastActiveAt ? new Date(ws.lastActiveAt).getTime() : 0;

      if (now.getTime() - lastActive > timeoutMs) {
        processManager.terminateWorkspaceProcess(ws._id.toString());
        ws.status = 'STOPPED';
        await ws.save();
        stoppedCount++;
      }
    }

    return { stoppedCount };
  }
}

const workspaceService = new WorkspaceService();

module.exports = {
  workspaceService,
  WorkspaceService,
};
