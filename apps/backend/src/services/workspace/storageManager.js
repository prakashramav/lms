const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Base workspaces directory under uploads
const WORKSPACES_ROOT = path.resolve(__dirname, '../../../../uploads/workspaces');
if (!fs.existsSync(WORKSPACES_ROOT)) {
  fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
}

class StorageManager {
  /**
   * Resolve secure absolute directory for a workspace
   */
  getWorkspaceDir(userId, workspaceId) {
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeWsId = String(workspaceId).replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(WORKSPACES_ROOT, safeUserId, safeWsId);
  }

  /**
   * Validate and resolve safe relative path inside workspace
   * Prevents directory traversal, root escapes, and null byte injection
   */
  resolveSafePath(workspaceDir, relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
      throw new Error('Invalid file path specified');
    }

    if (relativePath.includes('\0')) {
      throw new Error('Null byte detected in path');
    }

    // Reject explicit relative path traversal sequences attempting to escape
    if (/(^|[\\/])\.\.([\\/]|$)/.test(relativePath)) {
      throw new Error('Path traversal violation: Access outside workspace directory is prohibited');
    }

    // Resolve path directly
    const resolvedPath = path.resolve(workspaceDir, relativePath);
    const normalizedWs = path.resolve(workspaceDir);

    // Strict containment check
    if (!resolvedPath.startsWith(normalizedWs)) {
      throw new Error('Path traversal violation: Access outside workspace directory is prohibited');
    }

    return resolvedPath;
  }

  /**
   * Initialize a new persistent workspace directory with starter files
   */
  async initializeWorkspaceFiles(userId, workspaceId, starterFiles = [], manifestMeta = {}) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    if (!fs.existsSync(wsDir)) {
      await fs.promises.mkdir(wsDir, { recursive: true });
    }

    const manifest = {
      workspaceId,
      userId,
      initializedAt: new Date().toISOString(),
      files: {},
    };

    for (const file of starterFiles) {
      if (!file.path) continue;
      const targetPath = this.resolveSafePath(wsDir, file.path);
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        await fs.promises.mkdir(parentDir, { recursive: true });
      }

      await fs.promises.writeFile(targetPath, file.content || '', 'utf8');

      manifest.files[file.path] = {
        permission: file.permission || 'editable',
        size: Buffer.byteLength(file.content || '', 'utf8'),
        hash: crypto.createHash('sha256').update(file.content || '').digest('hex'),
      };
    }

    // Write manifest tracking permissions internally
    const manifestPath = path.join(wsDir, '.workspace_manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return {
      storagePath: wsDir,
      fileCount: starterFiles.length,
    };
  }

  /**
   * Read internal workspace manifest
   */
  async getManifest(wsDir) {
    const manifestPath = path.join(wsDir, '.workspace_manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = await fs.promises.readFile(manifestPath, 'utf8');
        return JSON.parse(raw);
      } catch {
        return { files: {} };
      }
    }
    return { files: {} };
  }

  /**
   * List files in workspace
   * Students NEVER see hidden files or instructor-only files
   */
  async listFiles(userId, workspaceId, isInstructor = false) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    if (!fs.existsSync(wsDir)) {
      return [];
    }

    const manifest = await this.getManifest(wsDir);
    const fileEntries = [];

    const walk = async (currentDir, relativePrefix = '') => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.workspace_manifest.json' || entry.name === '.git') {
          continue;
        }

        const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        const meta = manifest.files[relPath] || {};
        const permission = meta.permission || 'editable';

        // Hidden test and instructor-only secrecy: omit from student file list
        if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
          continue;
        }

        if (entry.isDirectory()) {
          const subDir = path.join(currentDir, entry.name);
          const children = await walk(subDir, relPath);
          // Only show folder if it contains visible items or if user is instructor
          if (isInstructor || children.length > 0) {
            fileEntries.push({
              name: entry.name,
              path: relPath,
              type: 'directory',
              permission,
              children,
            });
          }
        } else {
          const fullPath = path.join(currentDir, entry.name);
          const stat = await fs.promises.stat(fullPath);
          fileEntries.push({
            name: entry.name,
            path: relPath,
            type: 'file',
            size: stat.size,
            permission,
            updatedAt: stat.mtime,
          });
        }
      }
      return fileEntries;
    };

    const tree = [];
    const rootEntries = await fs.promises.readdir(wsDir, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.name === '.workspace_manifest.json' || entry.name === '.git') continue;
      const relPath = entry.name;
      const meta = manifest.files[relPath] || {};
      const permission = meta.permission || 'editable';

      if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
        continue;
      }

      if (entry.isDirectory()) {
        const children = [];
        await this._walkDir(path.join(wsDir, entry.name), entry.name, manifest, children, isInstructor);
        tree.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          permission,
          children,
        });
      } else {
        const stat = await fs.promises.stat(path.join(wsDir, entry.name));
        tree.push({
          name: entry.name,
          path: relPath,
          type: 'file',
          size: stat.size,
          permission,
          updatedAt: stat.mtime,
        });
      }
    }

    return tree;
  }

  async _walkDir(currentDir, relativePrefix, manifest, result, isInstructor) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = `${relativePrefix}/${entry.name}`;
      const meta = manifest.files[relPath] || {};
      const permission = meta.permission || 'editable';

      if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
        continue;
      }

      if (entry.isDirectory()) {
        const children = [];
        await this._walkDir(path.join(currentDir, entry.name), relPath, manifest, children, isInstructor);
        result.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          permission,
          children,
        });
      } else {
        const stat = await fs.promises.stat(path.join(currentDir, entry.name));
        result.push({
          name: entry.name,
          path: relPath,
          type: 'file',
          size: stat.size,
          permission,
          updatedAt: stat.mtime,
        });
      }
    }
  }

  /**
   * Read a file with permission checks
   */
  async readFile(userId, workspaceId, relativePath, isInstructor = false) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    const safePath = this.resolveSafePath(wsDir, relativePath);
    const manifest = await this.getManifest(wsDir);
    const normalizedRel = path.relative(wsDir, safePath).replace(/\\/g, '/');

    const meta = manifest.files[normalizedRel] || {};
    const permission = meta.permission || 'editable';

    // Secrecy guard: student cannot read hidden test files
    if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
      throw new Error('Access denied: Protected file cannot be accessed');
    }

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${normalizedRel}`);
    }

    const content = await fs.promises.readFile(safePath, 'utf8');
    return {
      path: normalizedRel,
      content,
      permission,
    };
  }

  /**
   * Write file with permission enforcement
   */
  async writeFile(userId, workspaceId, relativePath, content, isInstructor = false) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    const safePath = this.resolveSafePath(wsDir, relativePath);
    const manifest = await this.getManifest(wsDir);
    const normalizedRel = path.relative(wsDir, safePath).replace(/\\/g, '/');

    const meta = manifest.files[normalizedRel] || {};
    const permission = meta.permission || 'editable';

    // Only editable files can be modified by students
    if (!isInstructor && permission === 'readonly') {
      throw new Error(`Permission denied: File "${normalizedRel}" is read-only`);
    }
    if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
      throw new Error(`Permission denied: Cannot overwrite protected system file`);
    }

    const parentDir = path.dirname(safePath);
    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(safePath, content ?? '', 'utf8');

    // Update manifest hash and size
    manifest.files[normalizedRel] = {
      permission: isInstructor ? (meta.permission || 'editable') : permission,
      size: Buffer.byteLength(content ?? '', 'utf8'),
      hash: crypto.createHash('sha256').update(content ?? '').digest('hex'),
      updatedAt: new Date().toISOString(),
    };

    const manifestPath = path.join(wsDir, '.workspace_manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return {
      success: true,
      path: normalizedRel,
      permission,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(userId, workspaceId, relativePath, isInstructor = false) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    const safePath = this.resolveSafePath(wsDir, relativePath);
    const manifest = await this.getManifest(wsDir);
    const normalizedRel = path.relative(wsDir, safePath).replace(/\\/g, '/');

    const meta = manifest.files[normalizedRel] || {};
    const permission = meta.permission || 'editable';

    if (!isInstructor && permission === 'readonly') {
      throw new Error(`Permission denied: Read-only file cannot be deleted`);
    }
    if (!isInstructor && (permission === 'hidden' || permission === 'instructor')) {
      throw new Error(`Permission denied: Protected file cannot be deleted`);
    }

    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
      delete manifest.files[normalizedRel];
      const manifestPath = path.join(wsDir, '.workspace_manifest.json');
      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    }

    return { success: true };
  }

  /**
   * Compute immutable snapshot identifier of current student files
   */
  async computeSnapshotHash(userId, workspaceId) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    const manifest = await this.getManifest(wsDir);
    const sortedKeys = Object.keys(manifest.files || {}).sort();

    const hash = crypto.createHash('sha256');
    for (const key of sortedKeys) {
      hash.update(`${key}:${manifest.files[key].hash}`);
    }
    return hash.digest('hex');
  }

  /**
   * Delete entire workspace storage directory
   */
  async purgeWorkspace(userId, workspaceId) {
    const wsDir = this.getWorkspaceDir(userId, workspaceId);
    if (fs.existsSync(wsDir)) {
      await fs.promises.rm(wsDir, { recursive: true, force: true });
    }
    return true;
  }
}

const storageManager = new StorageManager();

module.exports = {
  storageManager,
  StorageManager,
  WORKSPACES_ROOT,
};
