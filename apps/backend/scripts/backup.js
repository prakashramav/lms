/**
 * Automated Database Backup Script
 * Phase 15 — Database Backup & Disaster Recovery (Sections 22 - 24)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const env = require('../src/config/env');

const BACKUP_DIR = path.resolve(__dirname, '../backups');

const runBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(BACKUP_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const collectionsToBackup = [
    'users',
    'courses',
    'enrollments',
    'jobs',
    'jobapplications',
    'certificates',
    'skills',
    'supporttickets',
    'auditlogs',
  ];

  const startTime = Date.now();
  console.log(`[Backup] Starting backup snapshot to ${targetDir}...`);

  const manifest = {
    timestamp,
    collections: {},
    totalDocuments: 0,
    status: 'IN_PROGRESS',
  };

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    for (const collName of collectionsToBackup) {
      try {
        const collection = db.collection(collName);
        const docs = await collection.find({}).toArray();
        const filePath = path.join(targetDir, `${collName}.json`);

        const content = JSON.stringify(docs, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');

        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        manifest.collections[collName] = {
          count: docs.length,
          file: `${collName}.json`,
          sha256: checksum,
        };
        manifest.totalDocuments += docs.length;
        console.log(`[Backup] Exported ${collName}: ${docs.length} records.`);
      } catch (err) {
        console.warn(`[Backup] Note: Could not export ${collName}: ${err.message}`);
      }
    }

    manifest.status = 'COMPLETED';
    manifest.durationMs = Date.now() - startTime;
    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log(`[Backup] Snapshot completed successfully in ${manifest.durationMs}ms. Total records: ${manifest.totalDocuments}`);
    return {
      success: true,
      backupPath: targetDir,
      manifest,
    };
  } catch (err) {
    console.error(`[Backup] Backup failed:`, err.message);
    manifest.status = 'FAILED';
    manifest.error = err.message;
    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = {
  runBackup,
  BACKUP_DIR,
};
