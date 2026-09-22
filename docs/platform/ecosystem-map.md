# Comprehensive Ecosystem Capability Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            PLATFORM ECOSYSTEM                                     │
└────────┬─────────────────────────┬─────────────────────────┬─────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
   STUDENT REALM            INSTRUCTOR REALM            ADMIN REALM
   • Course Catalog          • Curriculum Studio       • Platform Telemetry
   • Video Player            • Lesson Editor           • User Governance
   • Adaptive Diagnostics    • Assessment Builder      • Course Moderation
   • Code Sandbox            • Cohort Analytics        • AI Guardrails
   • Spaced Flashcards       • Student Feedback        • Audit Logs
   • Capstone Projects       • Payout History          • Data Quality
         │                         │                         │
         ├─────────────────────────┼─────────────────────────┤
         ▼                         ▼                         ▼
   CAREER & ATS              COMMUNITY & EVENTS        ORGANIZATION & TENANTS
   • ATS Resume Builder      • Community Channels      • Multi-Tenant Isolation
   • Job Board               • Event Calendar          • Cohort Velocity
   • Application Tracker     • Hackathons & Workshops  • Member Management
   • Mock Interviews         • Mentorship Directory    • Institutional Reports
   • Skill Gap Analyzer      • 1-on-1 Sessions         • Scoped Role RBAC
```

---

## Unified Entity Relationships

| Entity | Primary Relationships | Tenant / User Scoping |
| :--- | :--- | :--- |
| **Course** | Modules, Lessons, Assessments, Instructor | Public / Organization / Cohort |
| **Cohort** | Organization, Course, Instructors, Students | Strict Multi-Tenant (`organizationId`) |
| **MentorSession** | Mentor, Student, Calendar Time Slot | Participant Scoped (Student / Mentor) |
| **Event** | Organizer, Registered Participants, Calendar | Public / Institutional |
| **CommunityPost** | Category, Channel, Author, Comments | Public / Moderated |
| **Certificate** | Student, Course, Verification URL | Unique Identifier (`certificateId`) |
| **JobApplication** | Student, Job, Resume, Timeline | Student / Employer Scoped |
