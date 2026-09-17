# Incident Runbook: AI Provider Outage

## Severity: P2 (Major)

### Symptoms
- AI Tutor, Mock Interview feedback, or Resume ATS analysis returns `502` or `AI_PROVIDER_ERROR`.
- External Gemini or OpenAI API rate limits or outages reported.

---

### Triage & Diagnostics
1. Review AI health in Admin Dashboard (`/system-health` or `/admin/system`).
2. Test external AI provider status page (Google Cloud Status / OpenAI Status).
3. Check backend structured logs for `AI_PROVIDER_ERROR`.

---

### Mitigation & Graceful Fallback
1. **Fallback Provider**: Toggle fallback provider in configuration or Admin Settings:
   - If Gemini is failing, switch `AI_PROVIDER=openai` or enable mock fallback `AI_PROVIDER=mock`.
2. **Core Learning Protection**: Course lessons, video streaming, quizzes, coding problems, and assessments function independently of AI endpoints. Core student learning remains 100% active.
