# Job Application System & State Machine

## 1. Overview
The Application Tracking System provides students and recruiters with an auditable lifecycle for job applications. It prevents duplicate applications, enforces state machine transitions, and tracks historical timestamps and personal notes.

---

## 2. Finite State Machine
Applications transition according to strict validation rules:

```
[SAVED] ──────────► [APPLIED] ───► [SCREENING] ───► [INTERVIEW] ───► [OFFER]
   │                    │              │                 │              │
   ▼                    ▼              ▼                 ▼              ▼
[WITHDRAWN]        [REJECTED]     [REJECTED]        [REJECTED]     [REJECTED]
```

### Transition Validation Rules
```javascript
const ALLOWED_STATUS_TRANSITIONS = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['REJECTED', 'WITHDRAWN'],
  REJECTED: ['APPLIED'],
  WITHDRAWN: ['APPLIED'],
};
```

- **Student Permissions**: Students can only transition their own applications to `WITHDRAWN`.
- **Employer / Admin Permissions**: Authorized recruiters can advance candidates through `SCREENING`, `INTERVIEW`, `OFFER`, and `REJECTED`.

---

## 3. Duplicate Application Protection
A compound unique index on `{ studentId: 1, jobId: 1 }` guarantees that accidental double-clicks or repeated submissions reject gracefully with a 400 *"Application already recorded for this job"* error.

---

## 4. Audit Timeline & Private Notes
Every state change automatically creates a timeline event:
```json
{
  "status": "INTERVIEW",
  "timestamp": "2026-09-17T12:00:00.000Z",
  "note": "Technical round scheduled"
}
```
Students can also record private personal notes (e.g. preparation strategy, follow-up deadlines) that are never exposed to employers.
