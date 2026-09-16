# Coding Practice Platform Architecture

## Overview
The Coding Practice Platform is a production-grade coding and online judge system designed for career-readiness education. It provides an interactive Monaco Editor IDE with live preview rendering, automated testing across public and hidden test cases, and real-time telemetry.

## System Architecture

```
Student Frontend (Next.js 14 / Monaco Editor)
  │
  ▼  (HTTPS / REST with Bearer Token & Rate Limiting)
Express API Server (/api/v1/practice/*)
  │
  ├─► Problem & TestCase Catalog (MongoDB)
  ├─► Draft Autosave & Bookmarks (MongoDB)
  │
  ▼  (Job Enqueue)
Execution Queue (In-Memory / BullMQ Interface)
  │
  ▼  (Worker Dequeue)
Execution Worker (Zero DB / Zero Secret Isolation)
  │
  ├──► JavaScript Runner (Algorithm & Function Signature)
  ├──► HTML / CSS Runner (DOM Structure & Style Assertions)
  ├──► React Runner (Component Rendering & Simulated State)
  ├──► Node.js Runner (Standard I/O Streams & Data Processing)
  └──► Express.js Runner (In-Memory HTTP Route Dispatch)
  │
  ▼  (Sandboxed Execution)
Pristine V8 VM Sandbox (2.5s Timeout, Capped 10KB Buffer, Nullified Globals)
  │
  ▼
Output Normalization & Verdict Calculation
  │
  ▼
Submission Store & Student Score Telemetry
```

## Supported Categories & Problem Types
1. **JavaScript**: Algorithmic problem-solving, function signature evaluation, data structures (Arrays, Hash Maps, Stacks, Linked Lists).
2. **HTML & CSS**: Semantic markup validation, responsive design, Flexbox and CSS Grid layout assertions.
3. **React**: Component creation, state management (`useState`), props passing, and event simulation.
4. **Node.js**: Line counting streams, JSON configuration validators, CLI argument parsers, path normalizers.
5. **Express.js**: REST API routing (`GET`, `POST`, `PUT`, `DELETE`), status code assertion, header validation, and error middleware.

## Student IDE Capabilities
- **Monaco Code Editor**: Real-time syntax highlighting, line numbers, bracket pair colorization, font size toggle (12–18px), and copy to clipboard.
- **Draft Autosave**: Continuous background persistence with 800ms debounce preventing data loss on browser refresh.
- **Sandboxed Live Preview**: `<iframe sandbox="allow-scripts">` renders live interactive HTML/CSS and React components in isolation from parent cookies and tokens.
- **Multi-Tab Test Panel**: Interactive test case inputs, custom arguments runner, execution console (stdout), and submission history.
