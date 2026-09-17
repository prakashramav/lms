# Employer Ecosystem & Recruitment Architecture

## 1. Overview
The Employer Subsystem provides hiring partners with company profile management, job posting, applicant pipeline review, and interview scheduling workflows without exposing platform administrative capabilities.

---

## 2. Authorization Boundaries
- Employers can manage only their own `Company` profile (`employerUserIds`).
- Employers can view applications and resumes only for jobs posted by their company.
- Employers cannot modify platform settings, user permissions, courses, or other companies' data.

---

## 3. Endpoints
- `GET /api/v1/employer/company`: Fetch own company profile.
- `PATCH /api/v1/employer/company`: Update company info, logo, and website.
- `POST /api/v1/employer/jobs`: Create new job listing (starts in `PENDING_REVIEW` or `PUBLISHED`).
- `GET /api/v1/employer/applications`: Review candidate applications for company openings.
- `PATCH /api/v1/employer/applications/:applicationId`: Advance candidate to `SCREENING`, `INTERVIEW`, `OFFER`, or `REJECTED`.
