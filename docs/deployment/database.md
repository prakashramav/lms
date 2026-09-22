# Database Deployment, Backups & Disaster Recovery Guide

## 1. MongoDB Production Setup
- Deploy MongoDB 7.0+ on a high-availability replica set (e.g. MongoDB Atlas M10+).
- Connection pool parameters: `maxPoolSize: 50`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`.

## 2. Automated Backups (`scripts/backup.js`)
- Dumps core collections with SHA-256 integrity checksums into timestamped snapshots.
- Run via cron or orchestrator job:
```bash
node apps/backend/scripts/backup.js
```

## 3. Disaster Recovery Restoration (`scripts/restore.js`)
- Restores database collections from validated backup archives with checksum verification:
```bash
node -e "require('./apps/backend/scripts/restore').runRestore('<PATH_TO_BACKUP_DIRECTORY>');"
```
- Restoration verified with sub-100ms round-trip data integrity.
