# Phase 14 Gamification, Badges & Verifiable Certificates

## 1. Overview
The Gamification and Credentialing engine rewards consistent learning habits and validates mastery through cryptographically identifiable digital certificates.

## 2. Verifiable Certificates (`certificate.model.js`)
- **Criteria Enforcement**:
  - Certificates are issued exclusively upon 100% course completion and passing required assessments.
  - Generates a collision-resistant `certificateId` (e.g. `CERT-ABC123XYZ456`).
- **Public Verification**:
  - Route: `/verify/certificate/:id` (Frontend: `apps/student/src/app/verify/certificate/[id]/page.jsx`).
  - Endpoint: `GET /api/v1/certificates/verify/:id`.
  - Privacy Preservation: Shows only recipient name, course title, issuance date, and credential status; hides personal contact details or grades.

## 3. Achievement Badges & Learning Streaks
- **Streak Tracking**: Monitors daily and weekly learning engagement with healthy thresholds (discouraging burnout or excessive usage).
- **Badge Types**:
  - `Course Completed`
  - `Skill Milestone`
  - `Assessment Mastery`
  - `Portfolio Completion`
  - `Learning Streak`
- **Opt-Out & Constructive Leaderboards**: Students may toggle leaderboard participation, and rankings reflect constructive consistency rather than hyper-competitive gaming.
