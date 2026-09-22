const { workspaceService } = require('../services/workspace/workspace.service');
const { templateRegistry } = require('../services/workspace/templateRegistry');
const { storageManager } = require('../services/workspace/storageManager');
const { processManager } = require('../services/workspace/processManager');
const { testRunner } = require('../services/workspace/testRunner');
const { aiGateway } = require('../services/workspace/aiGateway');
const { databaseLab } = require('../services/workspace/databaseLab');
const { previewProxy } = require('../services/workspace/previewProxy');
const { formatResponse } = require('@edtech/shared');

class WorkspaceController {
  /**
   * List all available templates
   */
  async getTemplates(req, res, next) {
    try {
      const { category } = req.query;
      const templates = templateRegistry.listTemplates(category);
      return res.status(200).json(formatResponse(true, 'Templates retrieved', templates));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single template details
   */
  async getTemplateById(req, res, next) {
    try {
      const { templateId } = req.params;
      const template = templateRegistry.getTemplate(templateId);
      if (!template) {
        return res.status(404).json(formatResponse(false, 'Template not found'));
      }
      return res.status(200).json(formatResponse(true, 'Template details', template));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Provision or resume workspace
   */
  async provisionWorkspace(req, res, next) {
    try {
      const { courseId, moduleId, lessonId, assignmentId, templateId, hardware } = req.body;
      const userId = req.user._id;
      const userRole = req.user.role;

      const result = await workspaceService.getOrCreateWorkspace({
        userId,
        userRole,
        courseId,
        moduleId,
        lessonId,
        assignmentId,
        templateId: templateId || 'react',
        hardware,
      });

      return res.status(201).json(
        formatResponse(true, 'Workspace ready', {
          workspace: result.workspace,
          template: result.template,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get workspace details
   */
  async getWorkspace(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const userRole = req.user.role;

      const result = await workspaceService.getWorkspaceById(id, userId, userRole);
      return res.status(200).json(formatResponse(true, 'Workspace retrieved', result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * List workspace files (strictly masking hidden test files from students)
   */
  async listFiles(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const isInstructor = req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN';

      // Verify access to workspace
      await workspaceService.getWorkspaceById(id, userId, req.user.role);

      const files = await storageManager.listFiles(userId, id, isInstructor);
      return res.status(200).json(formatResponse(true, 'Files retrieved', files));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Read file content
   */
  async readFile(req, res, next) {
    try {
      const { id } = req.params;
      const { path: filePath } = req.query;
      const userId = req.user._id;
      const isInstructor = req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN';

      await workspaceService.getWorkspaceById(id, userId, req.user.role);
      const fileData = await storageManager.readFile(userId, id, filePath, isInstructor);

      return res.status(200).json(formatResponse(true, 'File content retrieved', fileData));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Write/save file
   */
  async writeFile(req, res, next) {
    try {
      const { id } = req.params;
      const { path: filePath, content } = req.body;
      const userId = req.user._id;
      const isInstructor = req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN';

      await workspaceService.getWorkspaceById(id, userId, req.user.role);
      const result = await storageManager.writeFile(userId, id, filePath, content, isInstructor);

      return res.status(200).json(formatResponse(true, 'File saved', result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req, res, next) {
    try {
      const { id } = req.params;
      const { path: filePath } = req.query;
      const userId = req.user._id;
      const isInstructor = req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN';

      await workspaceService.getWorkspaceById(id, userId, req.user.role);
      await storageManager.deleteFile(userId, id, filePath, isInstructor);

      return res.status(200).json(formatResponse(true, 'File deleted'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Start workspace
   */
  async start(req, res, next) {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.startWorkspace(id, req.user._id, req.user.role);
      return res.status(200).json(formatResponse(true, 'Workspace started', workspace));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stop workspace
   */
  async stop(req, res, next) {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.stopWorkspace(id, req.user._id, req.user.role);
      return res.status(200).json(formatResponse(true, 'Workspace stopped', workspace));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Restart workspace
   */
  async restart(req, res, next) {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.restartWorkspace(id, req.user._id, req.user.role);
      return res.status(200).json(formatResponse(true, 'Workspace restarted', workspace));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset workspace to original starter template files
   */
  async reset(req, res, next) {
    try {
      const { id } = req.params;
      const result = await workspaceService.resetWorkspace(id, req.user._id, req.user.role);
      return res.status(200).json(formatResponse(true, result.message, result.workspace));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Run terminal command
   */
  async runTerminalCommand(req, res, next) {
    try {
      const { id } = req.params;
      const { command, args, timeoutMs } = req.body;
      const userId = req.user._id;

      await workspaceService.getWorkspaceById(id, userId, req.user.role);

      const result = await processManager.executeCommand({
        userId,
        workspaceId: id,
        command: command || 'npm test',
        args: args || [],
        timeoutMs: Math.min(timeoutMs || 15000, 30000),
      });

      return res.status(200).json(formatResponse(true, 'Command executed', result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Run visible test suite
   */
  async runTests(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const { workspace } = await workspaceService.getWorkspaceById(id, userId, req.user.role);
      const testResults = await testRunner.runTests({
        userId,
        workspaceId: id,
        templateId: workspace.templateId,
        includeHidden: false, // Students only see visible tests
      });

      return res.status(200).json(formatResponse(true, 'Test run completed', testResults));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Final submission (runs visible + hidden tests and records grade)
   */
  async submit(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const { workspace } = await workspaceService.getWorkspaceById(id, userId, req.user.role);
      const submission = await testRunner.submitWorkspace({
        studentId: userId,
        workspace,
      });

      return res.status(200).json(formatResponse(true, 'Workspace submitted and graded', submission));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Execute Database Lab query (SQL, MongoDB, Redis)
   */
  async executeDatabaseQuery(req, res, next) {
    try {
      const { id } = req.params;
      const { type = 'SQL', query } = req.body;
      const userId = req.user._id;

      await workspaceService.getWorkspaceById(id, userId, req.user.role);

      let result;
      if (type.toUpperCase() === 'SQL') {
        result = await databaseLab.executeSqlQuery(query);
      } else if (type.toUpperCase() === 'MONGODB') {
        result = await databaseLab.executeMongoPipeline(query);
      } else if (type.toUpperCase() === 'REDIS') {
        result = await databaseLab.executeRedisCommand(query);
      } else {
        return res.status(400).json(formatResponse(false, 'Unsupported database type'));
      }

      return res.status(200).json(formatResponse(true, 'Database query executed', result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GenAI Gateway Chat endpoint
   */
  async callAiGateway(req, res, next) {
    try {
      const { id } = req.params;
      const { prompt, systemInstruction, model } = req.body;
      const userId = req.user._id;

      await workspaceService.getWorkspaceById(id, userId, req.user.role);

      const aiResponse = await aiGateway.processPrompt({
        userId,
        workspaceId: id,
        prompt,
        systemInstruction,
        model,
      });

      return res.status(200).json(formatResponse(true, 'AI Gateway response', aiResponse));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Live Preview Proxy handler
   */
  async servePreview(req, res) {
    return previewProxy.servePreview(req, res);
  }
}

const workspaceController = new WorkspaceController();

module.exports = {
  workspaceController,
  WorkspaceController,
};
