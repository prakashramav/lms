# Community & Discussion Architecture

## 1. Community Structure
The community operates across a clear hierarchy:

```
Category (e.g., Frontend Development, AI/ML, Career Discussions)
  └── Channel (e.g., #react-ecosystem, #nextjs, #ats-resume-reviews)
        └── Post (Questions, Technical Discussions, Project Showcases)
              └── Comments & Threaded Replies
```

---

## 2. Moderation, Safety & Spam Prevention
1. **Rate Limiting & Anti-Spam**:
   - Rate limiters restrict rapid posting and comment flooding.
   - Recursive sanitization strips malicious script tags and HTML injection.
2. **Community Reporting**:
   - Users can flag posts for spam, harassment, misinformation, or copyright violation.
   - Reported content is queued in the Admin Moderation Queue (`/api/v1/admin/reports`).
3. **AI Moderation Assistance**:
   - AI evaluates reported text and suggests action categories (`SPAM`, `HARASSMENT`, `SAFE`) along with supporting excerpts.
   - **Human in the Loop**: AI never autonomously deletes posts or bans users without moderator confirmation.
