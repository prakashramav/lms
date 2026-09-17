# Developer Guide: Local Setup, Architecture & Testing

## 1. Local Environment Setup & Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS.
- **Package Manager**: `npm` (Workspaces enabled).
- **Database**: MongoDB 7.0 running at `mongodb://localhost:27017/edtech_platform`.
- **Cache**: Redis 7.x (optional in development; in-memory fallback enabled).

---

## 2. Quickstart Execution Steps

### Step 1: Clone & Install Dependencies
```powershell
git clone <repository_url>
cd LMS
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default local variables are pre-configured for local testing:
- Student Portal: `http://localhost:3000`
- Instructor Studio: `http://localhost:3001`
- Admin Console: `http://localhost:3002`
- Backend API: `http://localhost:5000`

### Step 3: Start Services
In separate terminal windows (or via workspace scripts):
```powershell
# Backend API (Nodemon dev server)
cd apps/backend
npm run dev

# Student App (Next.js App Router)
cd apps/student
npm run dev

# Instructor App
cd apps/instructor
npm run dev

# Admin App
cd apps/admin
npm run dev
```

---

## 3. Running Automated Tests

Run the full backend integration and unit test suite:
```powershell
cd apps/backend
npm test
```
*Expected Result:* 26/26 test suites passing (266+ tests).

To run specific test categories:
```powershell
# Run security and RBAC tests only
npx jest tests/securityAudit.test.js tests/resourceAuth.test.js

# Run assessment tests
npx jest tests/assessment.test.js

# Run reliability & backup tests
npx jest tests/phase15Reliability.test.js
```

---

## 4. Code Standards & Architecture Guidelines
- **API Versioning**: All endpoints follow `/api/v1/*`.
- **Error Format**: All errors return `{ success: false, error: { code, message, details }, requestId }`.
- **RBAC**: Guard all protected routes with `authenticate` and `authorize('STUDENT' | 'INSTRUCTOR' | 'ADMIN')`.
- **Resource Protection**: Use `requireCourseOwnership` or `requireStudentResourceOwnership` to prevent IDOR vulnerabilities.
