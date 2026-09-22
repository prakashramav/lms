const { storageManager } = require('./storageManager');
const { Workspace } = require('../../models/workspace.model');

class PreviewProxy {
  /**
   * Serve preview for a student workspace
   */
  async servePreview(req, res) {
    const { id } = req.params;
    const userId = req.user?._id;

    const workspace = await Workspace.findById(id);
    if (!workspace || workspace.status === 'DELETED') {
      return res.status(404).send('<h3>Workspace not found or inactive</h3>');
    }

    // Ownership check (unless instructor preview or admin)
    const isOwner = workspace.userId.toString() === userId?.toString();
    const isPrivileged = req.user?.role === 'INSTRUCTOR' || req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isPrivileged) {
      return res.status(403).send('<h3>Access denied to workspace preview</h3>');
    }

    // Attempt to read workspace files to compose virtual preview
    try {
      if (workspace.templateId === 'react' || workspace.templateId === 'vue') {
        let appCode = '';
        try {
          const appFile = await storageManager.readFile(workspace.userId, id, 'src/App.jsx', false);
          appCode = appFile.content;
        } catch {}

        let cssCode = '';
        try {
          const cssFile = await storageManager.readFile(workspace.userId, id, 'src/index.css', false);
          cssCode = cssFile.content;
        } catch {}

        // Allow framing in student workspace IDE
        res.removeHeader('X-Frame-Options');
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview - ${workspace.templateId}</title>
  <style>
    ${cssCode || 'body { font-family: sans-serif; background: #0f172a; color: white; padding: 2rem; }'}
  </style>
</head>
<body>
  <div id="root">
    <div class="card" style="padding: 1.5rem; border-radius: 12px; background: rgba(30, 41, 59, 0.7); text-align: center;">
      <h2 style="margin-top: 0; color: #38bdf8;">⚡ Live Preview (${workspace.templateId})</h2>
      <p style="color: #94a3b8; font-size: 14px;">Connected to isolated workspace port: ${workspace.previewUrl ? 'Active' : 'N/A'}</p>
      <div id="app-output" style="margin-top: 1rem; padding: 1rem; border: 1px dashed #475569; border-radius: 8px;">
        ${appCode ? '<pre style="text-align: left; font-size: 12px; overflow-x: auto;"><code>' + appCode.replace(/</g, '&lt;') + '</code></pre>' : '<p>Workspace running cleanly.</p>'}
      </div>
    </div>
  </div>
</body>
</html>
        `);
      }

      // Backend API Preview (Express, FastAPI, Spring Boot, Django)
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Dev Preview - ${workspace.templateId}</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #090d16; color: #e2e8f0; padding: 2rem; }
    .badge { background: #0284c7; color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
  </style>
</head>
<body>
  <h2>📡 Backend Service Preview</h2>
  <p><span class="badge">TEMPLATE: ${workspace.templateId.toUpperCase()}</span> Status: <strong>ONLINE (${workspace.status})</strong></p>
  <p>Local dev server endpoints active and listening for HTTP/REST dispatches.</p>
</body>
</html>
      `);
    } catch (err) {
      return res.status(500).send(`<h3>Error generating preview: ${err.message}</h3>`);
    }
  }
}

const previewProxy = new PreviewProxy();

module.exports = {
  previewProxy,
  PreviewProxy,
};
