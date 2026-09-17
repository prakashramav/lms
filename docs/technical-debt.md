# Technical Debt & Architecture Evolution

This document transparently records architectural trade-offs, shortcuts taken during early iterations, and planned future improvements.

---

## 1. Vector Search Architecture
- **Current State**: Local vector embeddings computed with lightweight in-memory cosine similarity and Mongoose chunks (`vectorChunk.model.js`).
- **Trade-off**: Zero infrastructure overhead for small to mid-sized course catalogs; avoids requiring external managed vector databases (e.g. Pinecone/Weaviate).
- **Future Migration**: Migrate to MongoDB Atlas Vector Search or Pinecone as knowledge base scales beyond 100,000 chunks.

---

## 2. In-Memory Mock Fallbacks for AI and Code Execution
- **Current State**: When external AI providers (Gemini/OpenAI) or Judge0 are unconfigured or unavailable, the backend employs deterministic mock providers.
- **Trade-off**: Allows local offline development and self-contained CI testing without external cloud costs.
- **Future Migration**: Production deployments should ensure external credentials are provisioned in secret managers.

---

## 3. Next.js Image Optimization Warnings
- **Current State**: Some template components use standard `<img>` tags for avatar previews and thumbnail placeholders.
- **Trade-off**: Fast prototyping without configuring remote image domains in `next.config.js`.
- **Future Migration**: Replace `<img>` elements with `next/image` `<Image />` component with configured remote image domains for Cloudinary CDN optimization.

---

## 4. Background Job Queue Architecture
- **Current State**: Lightweight asynchronous worker processing with Redis fallback.
- **Trade-off**: Simple deployment footprint without requiring external BullMQ cluster workers.
- **Future Migration**: Scale to dedicated BullMQ worker processes as asynchronous email and video processing load increases.
