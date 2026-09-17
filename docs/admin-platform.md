# Admin Platform & Platform Operations Architecture

## Overview
The Admin Platform is an enterprise-grade administrative operations control center (`apps/admin`) paired with a robust backend service suite (`/api/v1/admin/*`). It enables platform operators, site administrators, and super administrators to supervise students, faculty, curriculum lifecycle, moderation reports, platform analytics, system health, and audit trails.

## Deployment Topology
| Service | Domain / Subdomain | Port (Dev) |
|---|---|---|
| Student Portal | `student.example.com` | 3000 |
| Instructor Portal | `instructor.example.com` | 3001 |
| Admin Operations Portal | `admin.example.com` | 3002 |
| API Gateway & Backend | `api.example.com` | 5000 |

## Core Principles
1. **Strict Role Separation**: Administrators and Super Administrators access the dedicated `/apps/admin` client and `/api/v1/admin/*` endpoints. Students and Instructors are blocked at the middleware layer with 403 Forbidden.
2. **Granular Permissions (RBAC)**: Privileges are defined per operational domain (`users.read`, `courses.approve`, `reports.manage`, etc.) rather than a blanket god-mode role.
3. **Append-Only Auditing**: Every administrative action (suspension, approval, rejection, permission change, settings alteration) is automatically preserved with actor ID, role, IP, target ID, metadata, and timestamps.
4. **Data Privacy Protection**: Administrative surfaces deliberately never expose student passwords, authentication tokens, or private AI tutoring conversations.
5. **Real Database Aggregation**: Dashboard and analytics surfaces reflect genuine MongoDB aggregation metrics rather than placeholder values.

## Architectural Layers
```
┌────────────────────────────────────────────────────────┐
│               Admin Web App (Next.js 14)               │
│  - Dashboard & KPI Cards       - Course Review Engine   │
│  - User Management Table       - Incident Triage Queue  │
│  - Audit Log Explorer          - Admin Provisioning     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT Auth
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│  - Authentication & MFA Verification Layer              │
│  - admin.permission.middleware (requireAdmin/Perm)     │
│  - Admin Controller & Modular Domain Services          │
│    ├── admin.user.service.js                           │
│    ├── admin.course.service.js                         │
│    ├── admin.analytics.service.js                      │
│    ├── admin.audit.service.js                          │
│    ├── admin.health.service.js                         │
│    └── admin.super.service.js                          │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
┌───────────────────────────▼────────────────────────────┐
│                   MongoDB Database                     │
│  - users, courses, reports, audit_logs, categories,    │
│    announcements, feature_flags, platform_settings    │
└────────────────────────────────────────────────────────┘
```
