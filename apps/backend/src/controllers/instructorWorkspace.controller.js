const { Lesson } = require('../models/lesson.model');
const { Assignment } = require('../models/assignment.model');
const { Workspace } = require('../models/workspace.model');
const { templateRegistry } = require('../services/workspace/templateRegistry');
const { workspaceService } = require('../services/workspace/workspace.service');
const { storageManager } = require('../services/workspace/storageManager');
const { formatResponse } = require('@edtech/shared');

class InstructorWorkspaceController {
  /**
   * Configure learning workspace environment on a Lesson
   */
  async configureLessonWorkspace(req, res, next) {
    try {
      const { lessonId } = req.params;
      const {
        enabled = true,
        type = 'CLOUD_IDE',
        templateId = 'react',
        hardware = 'cpu',
        starterFiles = [],
        tests = [],
        resourceProfile = 'STANDARD',
        inactivityTimeoutMinutes = 30,
      } = req.body;

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json(formatResponse(false, 'Lesson not found'));
      }

      lesson.workspace = {
        enabled,
        type,
        templateId,
        templateVersion: '1.0',
        hardware,
        starterFiles,
        tests,
        resourceProfile,
        inactivityTimeoutMinutes,
      };

      await lesson.save();

      return res.status(200).json(
        formatResponse(true, 'Lesson workspace environment configured successfully', {
          lessonId: lesson._id,
          workspace: lesson.workspace,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Configure learning workspace environment on an Assignment
   */
  async configureAssignmentWorkspace(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const {
        enabled = true,
        type = 'CLOUD_IDE',
        templateId = 'node-express',
        starterFiles = [],
        tests = [],
        resourceProfile = 'STANDARD',
        gradingPolicy = 'AUTO',
      } = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json(formatResponse(false, 'Assignment not found'));
      }

      assignment.workspace = {
        enabled,
        type,
        templateId,
        templateVersion: assignment.version || '1.0',
        starterFiles,
        tests,
        resourceProfile,
        gradingPolicy,
      };

      await assignment.save();

      return res.status(200).json(
        formatResponse(true, 'Assignment workspace environment configured successfully', {
          assignmentId: assignment._id,
          workspace: assignment.workspace,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * "Preview as Student": Spawns an isolated cloned workspace for instructor testing
   */
  async previewAsStudent(req, res, next) {
    try {
      const { lessonId, assignmentId, templateId } = req.body;
      const instructorId = req.user._id;

      // Spawn temporary preview workspace marked with isInstructorPreview: true
      const result = await workspaceService.getOrCreateWorkspace({
        userId: instructorId,
        userRole: 'INSTRUCTOR',
        lessonId,
        assignmentId,
        templateId: templateId || 'react',
        isInstructorPreview: true,
      });

      return res.status(201).json(
        formatResponse(true, 'Temporary student preview workspace spawned', {
          workspace: result.workspace,
          template: result.template,
          isInstructorPreview: true,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create custom workspace template
   */
  async createCustomTemplate(req, res, next) {
    try {
      const { id, name, category, runtime, frameworks, defaultCommand, previewPort, testCommand, starterFiles, defaultTests } = req.body;

      if (!id || !name) {
        return res.status(400).json(formatResponse(false, 'Template ID and Name are required'));
      }

      const template = templateRegistry.registerCustomTemplate(id, {
        id,
        name,
        category: category || 'CLOUD_IDE',
        runtime: runtime || { language: 'javascript', version: 'node-22' },
        frameworks: frameworks || [],
        defaultCommand: defaultCommand || 'npm run dev',
        previewPort: previewPort || 3000,
        testCommand: testCommand || 'npm test',
        starterFiles: starterFiles || [],
        defaultTests: defaultTests || [],
        createdBy: req.user._id,
      });

      return res.status(201).json(formatResponse(true, 'Custom template registered', template));
    } catch (err) {
      next(err);
    }
  }
}

const instructorWorkspaceController = new InstructorWorkspaceController();

module.exports = {
  instructorWorkspaceController,
  InstructorWorkspaceController,
};
