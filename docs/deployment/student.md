# Student Application Deployment Guide

## 1. Overview
The Student Application (`apps/student`) is a Next.js 14 application serving course discovery, interactive lesson viewer, assessments, AI tutor, portfolio, resume builder, job applications, certificate verification, and student support.

## 2. Environment Configuration
```env
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://student.example.com
```

## 3. Build & Run
```bash
# Production build
npm run build --workspace=apps/student

# Start production server
npm run start --workspace=apps/student
```

## 4. Edge CDN & Caching
- Enable caching for `/_next/static/*` with `Cache-Control: public, max-age=31536000, immutable`.
- Ensure `/verify/certificate/*` and dynamic routes are rendered server-side or with short cache TTL.
