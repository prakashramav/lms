# Phase 14 Admin Intelligence & Platform Analytics

## 1. Overview
Admin Intelligence introduces safe, aggregated data pipelines that deliver platform insights without querying high-volume transactional database collections during live dashboard visits.

## 2. Platform Intelligence Center
- **Key Metrics**:
  - Daily/Monthly Active Users (DAU/MAU).
  - Course enrollment and completion trajectories.
  - Job applications and interview conversion funnels.
  - AI token consumption, latency, and provider reliability metrics.

## 3. Cohort Retention & Conversion Funnels (`adminIntelligenceExtended.js`)
- **Retention Tracking**: Calculates Day 1, Day 7, and Day 30 retention rates by signup month and learning category.
- **Conversion Funnel Stages**:
  `Signup` -> `Profile Completed` -> `Course Enrolled` -> `Lesson Finished` -> `Assessment Passed` -> `Project Built` -> `Resume Optimized` -> `Job Applied` -> `Interview Scheduled`
- **AI Telemetry & Quality Feedback**:
  - Aggregates helpfulness ratings (Thumbs Up / Down) across AI features (Tutor, Coach, Career Assistant).
  - Surfaces latency histograms and provider error counts to platform engineers.
