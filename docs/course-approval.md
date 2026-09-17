# Course Approval & Moderation Lifecycle

## 1. Lifecycle State Machine
Courses traverse through an explicit state progression:
```
[DRAFT]
   │  (Instructor submits)
   ▼
[PENDING_REVIEW] ──(Admin Rejects)──> [REJECTED] ──(Instructor edits)──┐
   │                                                                    │
   │  (Admin Approves)                                                  │
   ▼                                                                    │
[APPROVED] ◄────────────────────────────────────────────────────────────┘
   │  (Publish with `courses.publish`)
   ▼
[PUBLISHED] (Publicly visible to students)
   │
   ├──(Unpublish)──> [DRAFT]
   ├──(Archive)────> [ARCHIVED]
   └──(Suspend)────> [SUSPENDED]
```

## 2. Review Process
1. **Submission**: Instructor submits completed course for review. Status changes from `DRAFT` to `PENDING_REVIEW`.
2. **Review Deck**: Admin visits `/courses/pending` and clicks **Review Curriculum**.
3. **Curriculum Inspection**: Full overview, modules, lessons, attached quizzes, coding problems, and resources are previewed.
4. **Decision**:
   - **Approve**: Sets status to `APPROVED`, logs `COURSE_APPROVE` audit event.
   - **Reject**: Prompts for mandatory constructive rejection reason, sets status to `REJECTED`, records reason in `course.rejectionReason`.
   - **Publish**: Once approved, authorized admins can publish directly to the student catalog.
