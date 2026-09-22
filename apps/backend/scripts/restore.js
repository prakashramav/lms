/**
 * Automated Database Restore Script
 * Phase 15 — Database Restore & Verification (Sections 22 - 24)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');

const runRestore = async (backupPath) => {
  const manifestPath = path.join(backupPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const startTime = Date.now();
  console.log(`[Restore] Starting restoration from ${backupPath}...`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const restoredSummary = {};
  let totalRestored = 0;

  for (const [collName, meta] of Object.entries(manifest.collections || {})) {
    const filePath = path.join(backupPath, meta.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Restore] Missing file ${filePath}, skipping...`);
      continue;
    }

    const rawContent = fs.readFileSync(filePath, 'utf8');
    const checksum = crypto.createHash('sha256').update(rawContent).digest('hex');
    if (checksum !== meta.sha256) {
      throw new Error(`Integrity check failed for ${collName}: Checksum mismatch.`);
    }

    const docs = JSON.parse(rawContent);
    if (docs.length > 0) {
      const collection = db.collection(collName);
      // Clean collection before restore
      await collection.deleteMany({});

      // Deserializing dates / objectIds properly if necessary
      const preparedDocs = docs.map((doc) => {
        if (doc._id && typeof doc._id === 'string' && doc._id.length === 24) {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        }
        return doc;
      });

      await collection.insertMany(preparedDocs);
      restoredSummary[collName] = preparedDocs.length;
      totalRestored += preparedDocs.length;
      console.log(`[Restore] Restored ${collName}: ${preparedDocs.length} records.`);
    } else {
      restoredSummary[collName] = 0;
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Restore] Restoration completed in ${durationMs}ms. Total records restored: ${totalRestored}`);

  return {
    success: true,
    durationMs,
    totalRestored,
    collections: restoredSummary,
  };
};

module.exports = {
  runRestore,
};
