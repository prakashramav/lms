# Instructor Application Deployment Guide

## 1. Overview
The Instructor Application (`apps/instructor`) provides curriculum creation, module/lesson builder, question bank authoring, cohort diagnostics, assessment management, and AI content assistant.

## 2. Environment Configuration
```env
PORT=3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://instructor.example.com
```

## 3. Build & Run
```bash
# Production build
npm run build --workspace=apps/instructor

# Start production server
npm run start --workspace=apps/instructor
```
