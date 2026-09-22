# Deployment & Operations Runbook

## 1. Prerequisites & Environment Setup
- **Node.js**: `v18.x` or `v20.x` LTS.
- **Database**: MongoDB 7.0 (local instance or MongoDB Atlas replica set).
- **Cache**: Redis 7.x (optional in local dev, recommended in production).
- **Process Manager**: PM2, systemd, or Docker container runtime.

---

## 2. Environment Configuration Validation

Verify that all required environment variables are set in `.env` prior to launch:
```ini
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech_platform
JWT_SECRET=super_secret_jwt_access_key_min_32_chars_long_change_in_production
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_min_32_chars_long_change_in_production
STUDENT_APP_URL=https://student.example.com
INSTRUCTOR_APP_URL=https://instructor.example.com
ADMIN_APP_URL=https://admin.example.com
API_URL=https://api.example.com
```

---

## 3. Production Build & Execution Commands

### A. Full Installation
```powershell
# In repository root
npm install
```

### B. Building Frontend Applications
```powershell
# Student App
cd apps/student
npm run build

# Instructor App
cd ../instructor
npm run build

# Admin App
cd ../admin
npm run build
```

### C. Running Verification Tests
```powershell
# Run backend test suite (26 suites, 266+ tests)
cd ../backend
npm test
```

### D. Starting Production Services
```powershell
# Backend API Gateway
cd apps/backend
node src/server.js

# Frontend Services (or via PM2/container orchestrator)
# Student: cd apps/student && npm start
# Instructor: cd apps/instructor && npm start
# Admin: cd apps/admin && npm start
```

---

## 4. Post-Deployment Smoke Test Protocol

Run these HTTP requests against production to verify baseline availability:
1. **Health Probe**:
   ```powershell
   curl http://localhost:5000/health
   # Expected response: {"status":"UP","service":"lms-backend",...}
   ```
2. **Readiness Probe**:
   ```powershell
   curl http://localhost:5000/ready
   # Expected response: {"status":"READY","database":"CONNECTED",...}
   ```
3. **Frontend Availability**:
   - Verify `http://localhost:3000` loads Student landing page.
   - Verify `http://localhost:3001` loads Instructor login page.
   - Verify `http://localhost:3002` loads Admin login page.

---

## 5. Rollback Procedure

If unexpected errors occur post-deployment:
1. Revert to previous Git release tag:
   ```powershell
   git checkout <last_working_tag>
   ```
2. Rebuild frontends:
   ```powershell
   npm run build --workspaces
   ```
3. Restart process services.
4. Verify `/ready` returns HTTP 200 with database connected.
