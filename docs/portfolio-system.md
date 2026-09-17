# Portfolio System & Showcase Architecture

## 1. Overview
The Portfolio Builder enables engineering students to publish a verified digital identity. Students curate production repositories, live application URLs, technical skills, and achievements.

---

## 2. Privacy & Visibility Controls
Portfolios support three distinct visibility states:
- **`PUBLIC`**: Indexed and accessible to all users and external recruiters at `/portfolio/:username`.
- **`UNLISTED`**: Accessible to anyone possessing the direct link; hidden from public exploration tables.
- **`PRIVATE`**: Strictly restricted to the authenticated student author. Requests by unauthenticated users or other students return a 403 Forbidden response.

---

## 3. SEO & Open Graph Metadata
Public portfolios automatically populate standard metadata:
- Canonical URL: `/portfolio/:username`
- Title: `<Username> | Developer Portfolio`
- Description: Extracted from student headline and about summary.
- Image: Verified student avatar or platform technical emblem.
