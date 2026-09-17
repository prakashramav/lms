# Mentorship System & Session Architecture

## 1. Overview
The Mentorship ecosystem connects students seeking career guidance, code reviews, and mock interviews with verified industry practitioners and instructors.

```mermaid
sequenceDiagram
    participant S as Student
    participant M as Mentor
    participant API as API Gateway (:5000)
    participant DB as MongoDB Persistence

    S->>API: GET /api/v1/mentors (Search by skill, role, language)
    API-->>S: Return verified mentor profiles
    S->>API: POST /api/v1/mentors/:id/request (Topic, requested slot)
    API->>DB: Create Session record (Status: REQUESTED)
    M->>API: GET /api/v1/mentors/sessions
    M->>API: POST /api/v1/mentors/sessions/:id/accept
    API->>DB: Update Session status to CONFIRMED (Prevent double booking)
    API-->>S: Send Session Confirmed Notification
```

---

## 2. Core Policies & Security Constraints

1. **Verification Status**:
   - Mentors undergo administrative vetting (`PENDING` -> `VERIFIED` -> `SUSPENDED`).
   - Unverified mentors are excluded from public student discovery.
2. **Double-Booking Defense**:
   - Server-side slot reservation checks prevent overlapping confirmed bookings for any mentor.
3. **Privacy of Session Notes**:
   - Mentors maintain private evaluation notes (`mentorNotes`) that are strictly omitted from student-facing payloads.
   - Students maintain their own personal action notes (`studentNotes`).
4. **Safety & Moderation**:
   - Both parties can flag inappropriate sessions or block users via `/api/v1/mentors/report`.
