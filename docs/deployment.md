# Production Deployment & Staging Guide

## 1. Target Architecture & Domains

The platform is configured for independent multi-domain deployment:
- **Student Application**: `https://student.example.com` (Vercel / AWS Amplify / Docker / Node.js)
- **Instructor Application**: `https://instructor.example.com` (Vercel / Cloudflare Pages / Docker / Node.js)
- **Admin Application**: `https://admin.example.com` (Internal VPN / Cloudflare Access / Docker / Node.js)
- **Backend API Gateway**: `https://api.example.com` (AWS ECS / Render / Railway / DigitalOcean App Platform / Kubernetes)

---

## 2. Pre-Deployment Verification Checklist

Before triggering a production deployment:
1. [x] All automated tests pass (`npm run test:backend`).
2. [x] Next.js frontend builds succeed with zero errors (`npm run build`).
3. [x] `MONGODB_URI` points to a high-availability replica set (Atlas M10+).
4. [x] High-entropy `JWT_SECRET` and `JWT_REFRESH_SECRET` generated (min 32 chars).
5. [x] Production CORS allowlist matches actual deployment domains.
6. [x] SSL/TLS certificates configured on all domains with HTTP-to-HTTPS redirection.
7. [x] Reverse proxies configure `X-Forwarded-For` and `X-Request-ID` headers.

---

## 3. Backend Deployment (Docker / Node.js)

### Environment Variables
Configure the following in your container orchestrator or hosting provider:
```env
APP_VERSION=1.0.0
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb+srv://prod_user:<PASSWORD>@cluster0.example.mongodb.net/edtech_production?retryWrites=true&w=majority
REDIS_URL=rediss://default:<PASSWORD>@prod-redis.cache.example.com:6379

JWT_SECRET=<MIN_32_CHARACTERS_CRYPTOGRAPHICALLY_SECURE_SECRET>
JWT_REFRESH_SECRET=<MIN_32_CHARACTERS_CRYPTOGRAPHICALLY_SECURE_SECRET>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_DOMAIN=.example.com

STUDENT_APP_URL=https://student.example.com
INSTRUCTOR_APP_URL=https://instructor.example.com
ADMIN_APP_URL=https://admin.example.com
API_URL=https://api.example.com
CORS_ORIGIN=https://student.example.com,https://instructor.example.com,https://admin.example.com

AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=<KEY>

JUDGE0_API_URL=https://judge0.example.com
JUDGE0_API_KEY=<KEY>
```

### Process Management
Run using Node.js or Docker:
```bash
# Production start command
npm run start --workspace=apps/backend
```

---

## 4. Frontend Deployments (Next.js)

Each frontend application is an independent Next.js app:
1. **Student App**:
   - Directory: `apps/student`
   - Build Command: `npm run build`
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://api.example.com/api/v1`
2. **Instructor App**:
   - Directory: `apps/instructor`
   - Build Command: `npm run build`
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://api.example.com/api/v1`
3. **Admin App**:
   - Directory: `apps/admin`
   - Build Command: `npm run build`
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://api.example.com/api/v1`

---

## 5. Post-Deployment Smoke Verification

Execute following health probes after deployment:
1. **Liveness Check**:
   ```bash
   curl -I https://api.example.com/live
   # Expect HTTP 200 with {"status": "ALIVE"}
   ```
2. **Readiness Probe**:
   ```bash
   curl https://api.example.com/ready
   # Expect HTTP 200 with {"status": "READY", "database": "CONNECTED"}
   ```
3. **Cross-Origin Handshake**:
   ```bash
   curl -H "Origin: https://student.example.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS https://api.example.com/api/v1/auth/login
   # Expect HTTP 204 with Access-Control-Allow-Origin: https://student.example.com
   ```

---

## 6. Rollback Strategy

1. **Backend Rollback**:
   - Revert container image tag to previous stable release SHA.
   - Traffic transitions seamlessly via container orchestrator rolling updates.
2. **Frontend Rollback**:
   - Instant rollback in Vercel / CDN provider to previous deployment hash.
3. **Database Considerations**:
   - Schema modifications in Mongoose are backward-compatible.
   - Never drop active collections or fields without multi-step migrations.
