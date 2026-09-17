# Production Monitoring, Observability & Telemetry

## 1. Overview
ApexLearn incorporates comprehensive telemetry across metrics, structured logging, distributed tracing, and automated alerting, providing real-time visibility into application health, database performance, queue depths, and third-party dependencies.

---

## 2. Structured JSON Logging Architecture

All production logs emit newline-delimited JSON (NDJSON) with contextual metadata:

### 2.1 Standard Log Schema
```json
{
  "timestamp": "2026-09-18T00:15:32.481Z",
  "level": "INFO",
  "service": "apexlearn-backend",
  "requestId": "req_c92f8b1a4e2d",
  "userId": "64f1c9d2e1b4a8001c9a1234",
  "tenantId": "org_77a91b2c",
  "method": "POST",
  "route": "/api/v1/practice/execute",
  "statusCode": 200,
  "durationMs": 142,
  "message": "Code execution completed successfully"
}
```

### 2.2 Sensitive Data Redaction Policies
To protect user privacy and comply with data governance regulations, the logging middleware (`src/middlewares/logging.middleware.js`) strictly strips:
- Passwords and password hashes
- JWT tokens (`Bearer ...` and cookie tokens)
- Credit card and CVV details
- Full resume text or PII
- Private AI prompt conversations

---

## 3. Metrics Collection & Telemetry Probes

The backend exposes runtime metrics via `/metrics` and internal probes:

| Probe Endpoint | Target Consumer | Purpose |
| :--- | :--- | :--- |
| `GET /health` | Load Balancer | Basic HTTP listener process liveness |
| `GET /ready` | Orchestrator (K8s/ECS) | Dependency validation (verifies active MongoDB connection) |
| `GET /live` | K8s kubelet | Process responsiveness and memory ceiling check |
| `GET /metrics` | Prometheus Scraper | In-memory APM telemetry snapshot (requests, latencies, error counts) |

---

## 4. Alerting Thresholds & Severity Tiers

| Alert Name | Condition / Threshold | Severity | Notification Channel | Auto-Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **HighErrorRate** | HTTP 5xx errors > 1% over 5m | **Critical** | PagerDuty + Slack `#incidents` | Trigger auto-rollback investigation |
| **DatabaseDisconnected** | MongoDB `/ready` probe returns 503 | **Critical** | PagerDuty | Failover to secondary replica |
| **ElevatedApiLatency** | API $p95$ > 500ms for 5m | **Warning** | Slack `#engineering-alerts` | Scale out ECS container tasks |
| **QueueBacklog** | BullMQ backlog > 1,000 jobs | **Warning** | Slack `#engineering-alerts` | Auto-scale worker pool instances |
| **AiRouterDegraded** | Circuit breaker tripped on Gemini/OpenAI | **Warning** | Slack `#ai-telemetry` | Failover to fallback provider |
| **CertificateRevoked** | Admin issues certificate revocation | **Info** | Slack `#audit-log` | Audit record logged |

---

## 5. Non-Fabricated Telemetry Commitment
In compliance with Section 251 and 252, all dashboard metrics reflect actual collected measurements. If an environment has not yet generated telemetry, displays render `"No telemetry collected"` rather than simulated vanity numbers.
