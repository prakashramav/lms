# Phase 14 Student Support & Helpdesk Ecosystem

## 1. Overview
The Support Ticket system offers structured issue resolution across technical, course content, account, career, and billing topics, accelerated by an automated AI Classifier.

## 2. Data Model (`SupportTicket`)
- **Fields**:
  - `ticketNumber`: Auto-incrementing identifier (e.g. `TICK-1001`).
  - `category`: `['TECHNICAL', 'COURSE_CONTENT', 'ACCOUNT', 'CAREER', 'BILLING', 'OTHER']`.
  - `priority`: `['LOW', 'MEDIUM', 'HIGH', 'URGENT']`.
  - `status`: `['OPEN', 'IN_PROGRESS', 'WAITING_ON_STUDENT', 'RESOLVED', 'CLOSED']`.
  - `aiClassification`: Stores detected category, confidence score, urgency rating, and suggested initial steps.
  - `messages`: Threaded conversation between student and support staff with timestamping.

## 3. AI Support Classifier (`aiSupportClassifier.js`)
- Evaluates inbound student ticket descriptions to predict the category and urgency level.
- Recommends self-help resolution steps while keeping the ticket open for human staff review.
- Prevents automated premature closure of high-severity issues.

## 4. REST Endpoints
- `POST /api/v1/support/tickets`: Create ticket with auto-categorization.
- `GET /api/v1/support/tickets`: List student's open/resolved tickets.
- `GET /api/v1/support/tickets/:ticketId`: Fetch complete ticket thread.
- `POST /api/v1/support/tickets/:ticketId/messages`: Append response message.
- `PATCH /api/v1/support/tickets/:ticketId/status`: Update status (staff/student).
