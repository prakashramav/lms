const express = require('express');
const { workspaceController } = require('../../../controllers/workspace.controller');
const { authenticate, optionalAuthenticate } = require('../../../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for terminal and code executions
const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many workspace executions. Please wait.' },
});

// 1. Templates Catalog
router.get('/templates', optionalAuthenticate, workspaceController.getTemplates);
router.get('/templates/:templateId', optionalAuthenticate, workspaceController.getTemplateById);

// 2. Workspace Provisioning & Metadata
router.post('/', authenticate, workspaceController.provisionWorkspace);
router.get('/:id', authenticate, workspaceController.getWorkspace);

// 3. File Explorer & Persistence APIs
router.get('/:id/files', authenticate, workspaceController.listFiles);
router.get('/:id/files/content', authenticate, workspaceController.readFile);
router.put('/:id/files/content', authenticate, workspaceController.writeFile);
router.delete('/:id/files/content', authenticate, workspaceController.deleteFile);

// 4. Lifecycle Controls
router.post('/:id/start', authenticate, workspaceController.start);
router.post('/:id/stop', authenticate, workspaceController.stop);
router.post('/:id/restart', authenticate, workspaceController.restart);
router.post('/:id/reset', authenticate, workspaceController.reset);

// 5. Terminal, Testing & Evaluation
router.post('/:id/terminal', authenticate, executionLimiter, workspaceController.runTerminalCommand);
router.post('/:id/test', authenticate, executionLimiter, workspaceController.runTests);
router.post('/:id/submit', authenticate, workspaceController.submit);

// 6. Database Lab & AI Gateway
router.post('/:id/database', authenticate, workspaceController.executeDatabaseQuery);
router.post('/:id/ai-gateway', authenticate, workspaceController.callAiGateway);

// 7. Live Preview Proxy
router.get('/:id/preview', authenticate, workspaceController.servePreview);
router.get('/:id/preview/*', authenticate, workspaceController.servePreview);

module.exports = router;
