# Production Database Architecture & Operational Guide

## 1. Overview
The ApexLearn data persistence tier is built on MongoDB (v7.0+), supporting multi-tenant institutional isolation, compound indexing for low-latency queries, ACID transactions for financial and certification integrity, and automated snapshot backup/recovery.

---

## 2. Connection Management & Pooling

### 2.1 Configuration Parameters
Connection pooling is centrally managed in `apps/backend/src/config/db.js` with the following production constraints:

| Parameter | Production Value | Description |
| :--- | :--- | :--- |
| `minPoolSize` | `5` | Minimum pre-warmed sockets to maintain per backend process. |
| `maxPoolSize` | `50` | Maximum socket ceiling per Node.js instance preventing socket starvation on MongoDB. |
| `serverSelectionTimeoutMS` | `5000` | Fails fast (5 seconds) if cluster primary/replicas are unreachable. |
| `socketTimeoutMS` | `45000` | Sockets terminated if inactive for 45s to avoid socket leaks. |
| `connectTimeoutMS` | `10000` | Initial TCP handshake timeout. |
| `heartbeatFrequencyMS` | `10000` | Cluster topology discovery and replica health polling. |
| `retryWrites` | `true` | Transparent single retry on transient network hiccups for write operations. |
| `w` | `'majority'` | Write concern requiring majority replica acknowledgment before commit. |

### 2.2 Graceful Connection Lifecycle
```javascript
// Graceful shutdown lifecycle in src/server.js
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful database disconnection...`);
  await mongoose.connection.close(false); // Do not force; allow in-flight operations to complete
  logger.info('MongoDB connection cleanly terminated.');
  process.exit(0);
};
```

---

## 3. Database Schema & Compound Index Audit

To eliminate collection scans (`COLLSCAN`), high-traffic collections have audited compound indexes:

| Collection | Compound / Unique Index | Query Pattern / Purpose |
| :--- | :--- | :--- |
| **`users`** | `{ email: 1 }` (unique) | Authentication login & duplicate detection |
| **`users`** | `{ organizationId: 1, role: 1, status: 1 }` | Multi-tenant user roster & RBAC directory filtering |
| **`courses`** | `{ status: 1, category: 1, difficulty: 1 }` | Public catalog discovery & filtering |
| **`courses`** | `{ instructorId: 1, createdAt: -1 }` | Instructor course management dashboard |
| **`courses`** | `{ organizationId: 1, status: 1 }` | Enterprise tenant course access |
| **`enrollments`** | `{ studentId: 1, courseId: 1 }` (unique) | Student course progress & enrollment verification |
| **`enrollments`** | `{ courseId: 1, status: 1, progress: -1 }` | Instructor cohort analytics & completion leaderboards |
| **`submissions`** | `{ studentId: 1, problemId: 1, status: 1 }` | Coding practice history & test case validation |
| **`assessments`** | `{ courseId: 1, status: 1 }` | Course quiz/exam retrieval |
| **`certificates`** | `{ certificateId: 1 }` (unique) | Public cryptographic certificate verification |
| **`certificates`** | `{ studentId: 1, courseId: 1 }` | Duplicate certificate issuance prevention |
| **`orders`** | `{ orderId: 1 }` (unique) | Payment webhook order processing |
| **`orders`** | `{ userId: 1, status: 1, createdAt: -1 }` | Student purchase history & billing receipts |
| **`entitlements`** | `{ userId: 1, resourceType: 1, resourceId: 1 }` (unique) | Authoritative access control check |
| **`events`** | `{ status: 1, startTime: 1 }` | Upcoming event calendar & discovery |
| **`eventregistrations`** | `{ eventId: 1, userId: 1 }` (unique) | Registration tracking & waitlist promotion |
| **`mentorsessions`** | `{ mentorId: 1, startTime: 1, endTime: 1 }` | Concurrency lock for double-booking prevention |
| **`communityposts`** | `{ channelId: 1, createdAt: -1 }` | Channel post feed pagination |
| **`communitycomments`**| `{ postId: 1, parentId: 1, createdAt: 1 }` | Threaded discussion comments |
| **`auditlogs`** | `{ timestamp: -1, actorId: 1, action: 1 }` | Security audit & compliance investigations |

---

## 4. Multi-Document ACID Transactions

MongoDB multi-document transactions (`session.withTransaction`) are strictly enforced for operations where partial writes would cause financial or integrity corruption:

### 4.1 Order Processing & Entitlement Granting
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Update Order status to 'paid'
  const order = await Order.findOneAndUpdate(
    { orderId, status: 'pending' },
    { status: 'paid', paidAt: new Date(), paymentTransactionId },
    { session, new: true }
  );
  if (!order) throw new Error('Order not eligible for entitlement');

  // 2. Grant authoritative Entitlement
  await Entitlement.create([{
    userId: order.userId,
    resourceType: order.itemType,
    resourceId: order.itemId,
    orderId: order._id,
    grantedAt: new Date(),
  }], { session });

  // 3. Log Audit Record
  await AuditLog.create([{
    action: 'ENTITLEMENT_GRANTED',
    actorId: order.userId,
    targetId: order.itemId,
    details: { orderId: order.orderId, amount: order.amount },
  }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4.2 Certificate Issuance & Student Milestone
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Verify completion server-side
  const enrollment = await Enrollment.findOne({ studentId, courseId }).session(session);
  if (!enrollment || enrollment.progress < 100) {
    throw new Error('Course completion criteria not met');
  }

  // Issue unique Certificate
  const certificate = await Certificate.create([{
    certificateId: generateSecureCertificateId(),
    studentId,
    courseId,
    issuedAt: new Date(),
    status: 'valid',
  }], { session });

  // Update enrollment with certificate reference
  enrollment.certificateIssued = true;
  enrollment.certificateId = certificate[0]._id;
  await enrollment.save({ session });

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

## 5. Slow Query Profiling & Performance Mitigation

### 5.1 MongoDB Database Profiler Configuration
In staging and production, queries executing longer than 100ms are captured:
```javascript
// Enable profiling for slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 });
```

### 5.2 Anti-Patterns Prohibited
1. **No Unbounded Queries**: All collection queries must provide an explicit `.limit(N)` with max allowed ceiling `100`.
2. **No N+1 Loop Queries**: Batch references using `$in: [id1, id2, ...]` or single aggregation stages.
3. **No Dynamic Sorting on Non-Indexed Fields**: Sorting fields are strictly validated against an approved field whitelist.
4. **No Heavy Projections**: Never return large unused fields (e.g. `rawVideoData`, `embeddingVector`) unless explicitly requested.

---

## 6. Backup & Disaster Recovery Standards

| Metric | Target Standard | Operational Strategy |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **15 Minutes** | Continuous automated oplog archiving via MongoDB Atlas or replica snapshot cron. |
| **RTO (Recovery Time Objective)** | **1 Hour** | Automated restore script `scripts/restore.js` with point-in-time recovery verification. |
| **Daily Full Backup** | 02:00 UTC | `mongodump` archive encrypted with AES-256 and uploaded to cold storage bucket. |
| **Backup Retention** | 30 Days (Daily), 12 Months (Monthly) | Automated lifecycle policy on backup object storage. |
