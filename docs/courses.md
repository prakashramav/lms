# Course Architecture & Data Models

## Overview
The Course Management subsystem forms the foundation of the EdTech learning platform. It allows courses to be discovered, viewed, and structured into ordered modules and lessons, supporting both public catalog discovery and authenticated learning tracks.

---

## Course Hierarchy
```
Course
  └── Module (ordered 1..N)
        └── Lesson (ordered 1..N)
              ├── Lesson Content (VIDEO, ARTICLE, READING, RESOURCE)
              └── Quiz / Assignment / Practice (Future Engines)
```

---

## Models & Schemas

### 1. Course (`Course.js`)
- **Fields**:
  - `title` (String, required)
  - `slug` (String, unique, lowercase)
  - `shortDescription` (String)
  - `description` (String)
  - `thumbnail` (String URL)
  - `banner` (String URL)
  - `category` (String, indexed)
  - `level` / `difficulty` (`Beginner` | `Intermediate` | `Advanced`, indexed)
  - `skills` ([String])
  - `language` (String, default: "English")
  - `duration` (String, e.g. "24 hours")
  - `instructor` (Object: `name`, `title`, `bio`, `avatar`)
  - `status` (`DRAFT` | `PUBLISHED` | `ARCHIVED`, default: `DRAFT`, indexed)
  - `isPublished` (Boolean, default: false)
  - `featured` (Boolean, default: false)
  - `requirements` ([String])
  - `learningOutcomes` ([String])
- **Indexes**:
  - Compound / Single: `{ slug: 1 }`, `{ status: 1 }`, `{ category: 1 }`, `{ difficulty: 1 }`, `{ featured: 1 }`
  - Text Index: `{ title: 'text', shortDescription: 'text', description: 'text', skills: 'text', category: 'text' }`

### 2. Module (`Module.js`)
- **Fields**:
  - `courseId` (ObjectId ref `Course`, required, indexed)
  - `title` (String, required)
  - `description` (String)
  - `order` (Number, default: 0)
  - `isPublished` (Boolean, default: true)
- **Indexes**:
  - Compound Index: `{ courseId: 1, order: 1 }`

### 3. Lesson (`Lesson.js`)
- **Fields**:
  - `courseId` (ObjectId ref `Course`, required, indexed)
  - `moduleId` (ObjectId ref `Module`, required, indexed)
  - `title` (String, required)
  - `slug` (String)
  - `description` (String)
  - `type` (`VIDEO` | `ARTICLE` | `READING` | `RESOURCE`, extensible to `QUIZ`, `ASSIGNMENT`, `CODING`)
  - `order` (Number, default: 0)
  - `duration` (Number in minutes)
  - `videoUrl` (String, sanitized/masked for non-enrolled users)
  - `content` (String, sanitized/masked for non-enrolled users)
  - `resources` (Array of `{ title, url, type, size }`)
  - `isPreview` (Boolean, default: false)
  - `isPublished` (Boolean, default: true)
- **Indexes**:
  - Compound Index: `{ courseId: 1, moduleId: 1, order: 1 }`

---

## Free vs. Premium Access Control
1. **Free / Public Catalog**:
   - Only `PUBLISHED` courses appear in public catalog and search.
   - Anyone can view course metadata and curriculum outlines.
2. **Preview Lessons**:
   - Lessons flagged with `isPreview = true` allow unauthenticated visitors and unenrolled students to watch/read content.
3. **Protected Lessons**:
   - Lessons where `isPreview = false` require an authenticated `STUDENT` with an `ACTIVE` `Enrollment` record.
   - Video URLs, content bodies, and downloadable resource links are sanitized to `null` server-side if access is not verified.
