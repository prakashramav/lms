const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  // Code / text
  'application/json',
  'application/javascript',
  'text/javascript',
  'text/css',
  'text/html',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

class StorageProvider {
  /**
   * Validate and save file buffer to storage
   * @param {object} file
   * @param {Buffer} file.buffer
   * @param {string} file.originalname
   * @param {string} file.mimetype
   * @param {number} file.size
   * @param {string} [folder]
   * @returns {Promise<{ url: string, key: string, size: number, mimeType: string, name: string }>}
   */
  async uploadFile(file, folder = 'resources') {
    if (!file || !file.buffer) {
      throw new Error('No file data provided.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds the 25MB maximum limit.`);
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`File type "${mimeType}" is not allowed.`);
    }

    const targetDir = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate safe unique filename
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const filename = `${safeBase}_${randomSuffix}${ext}`;
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    const relativeKey = `${folder}/${filename}`;
    const url = `/uploads/${relativeKey}`;

    return {
      name: file.originalname,
      url,
      key: relativeKey,
      size: file.size,
      mimeType,
    };
  }

  /**
   * Delete file by key
   * @param {string} key
   */
  async deleteFile(key) {
    if (!key) return;
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(UPLOADS_DIR, safeKey);
    if (fs.existsSync(fullPath)) {
      try {
        await fs.promises.unlink(fullPath);
      } catch (err) {
        console.warn(`[Storage] Failed to delete file ${fullPath}:`, err.message);
      }
    }
  }

  /**
   * Get public or stream URL for file key
   * @param {string} key
   */
  getUrl(key) {
    return `/uploads/${key}`;
  }
}

const storageService = new StorageProvider();

module.exports = {
  storageService,
  StorageProvider,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};
