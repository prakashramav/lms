# Admin Application Deployment Guide

## 1. Overview
The Admin Application (`apps/admin`) manages platform intelligence, course reviews, users, companies, audit logs, AI monitoring, support tickets, and feature flags.

## 2. Environment Configuration
```env
PORT=3002
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://admin.example.com
```

## 3. Network Security
- Deploy behind an internal VPN or zero-trust identity-aware proxy (e.g. Cloudflare Access, AWS Tailscale, Google IAP).
- Enforce strict IP allowlisting where appropriate.
