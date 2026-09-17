# Job Discovery & Board Architecture

## 1. Overview
The Job Discovery engine connects platform learners with verified partner opportunities. It features server-side faceted filtering, text search indexing, bookmarking, matching signal explainability, and abuse reporting.

---

## 2. Data Model & Indexing (`Job`)
The `Job` schema includes:
- `title`, `companyId` (ref `Company`)
- `description`, `skills` (`[String]`)
- `location`, `remoteType` (`REMOTE`, `HYBRID`, `ONSITE`)
- `employmentType` (`FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`)
- `experienceLevel` (`ENTRY`, `MID`, `SENIOR`, `LEAD`)
- `salaryRange` (`min`, `max`, `currency`, `period`)
- `source` (`PLATFORM`, `EMPLOYER`, `ADMIN`, `EXTERNAL`)
- `status` (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `EXPIRED`, `ARCHIVED`)

### Compound & Text Indexes
```javascript
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ remoteType: 1, experienceLevel: 1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
```

---

## 3. Transparent Matching Signals
For authenticated students, each job is evaluated against the student's verified skills:
- **`matchingSignals`**: Factual matches such as *"Matches your React skill"* or *"Matches remote work preference"*.
- **`missingSkills`**: Competencies in the job description that the student has not yet practiced on the platform.
- **Match Percentage**: Explainable skill intersection percentage. Does not predict hiring outcomes.

---

## 4. Moderation & Abuse Reporting
- Students can submit a `JobReport` (`SPAM`, `FRAUD`, `INCORRECT_INFO`, `EXPIRED`, `MISLEADING`).
- Administrators can transition listings between `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, and `ARCHIVED`.
