# Employer Application & Workflows Deployment Guide

## 1. Overview
The Employer interface enables talent acquisition partners to manage job postings, search authorized candidate profiles, advance applicants across the ATS Kanban pipeline, and track hiring conversion metrics.

## 2. Access & Authentication
- Employers authenticate via the unified authentication gateway with role `EMPLOYER` or `ADMIN`.
- Accessible directly or via configured tenant domain (`https://employer.example.com`).

## 3. Configuration
```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://employer.example.com
```
