# Multi-Resume System & ATS Audit Architecture

## 1. Overview
The Resume Builder allows students to create, version, and export multiple role-targeted technical resumes (e.g. Frontend, Backend, Systems). Built-in ATS keyword audits evaluate structural completeness and skill alignment without making false hiring guarantees.

---

## 2. Templates & Data Model (`Resume`)
### Supported Templates
1. **Modern**: Balanced visual layout emphasizing project metrics and stack highlights.
2. **Minimal**: Ultra-clean text presentation for strict applicant tracking systems.
3. **Technical**: Prioritizes repository links, system design outcomes, and tooling.

### Data Sections
- `personalInfo`: Name, email, phone, location, GitHub, LinkedIn.
- `summary`: Concise 2-3 sentence technical positioning.
- `skills`: Categorized skill proficiency tags.
- `experience`: Company, role, tenure, quantifiable impact bullets.
- `projects`: Architecture, technologies, repository URL, live demo.
- `education`: Institution, degree, GPA.
- `version` & `versionHistory`: Snapshot archive on each update enabling one-click restore.

---

## 3. ATS Keyword Analysis Engine
The analyzer evaluates:
1. **Structural Completeness**: Verifies mandatory sections (contact, skills, experience, projects).
2. **Keyword Coverage**: Compares resume text against target career path or job description keywords.
3. **Actionable Recommendations**: Flags missing sections or suggested bullet phrasing.

> [!IMPORTANT]
> The audit strictly includes the disclaimer: *"Analysis is an automated structural evaluation against target keywords and does not guarantee interview shortlisting."*

---

## 4. Privacy & Authorization
- Resumes are private to the authoring student (`studentId`).
- A student cannot read, edit, or delete another student's resume (tested via IDOR security tests).
- When submitting a job application, a snapshot of the selected resume is linked to the recruiter.
