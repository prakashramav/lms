const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
const tokenService = require('../src/services/token.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Instructor Created Course Visibility & Lifecycle Suite', () => {
  let instructorA;
  let instructorB;
  let studentUser;
  let adminUser;
  let tokenA;
  let tokenB;
  let studentToken;
  let adminToken;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
    ]);

    instructorA = await User.create({
      name: 'Professor Ada Lovelace',
      email: 'ada@university.edu',
      password: 'SecurePassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    instructorB = await User.create({
      name: 'Professor Alan Turing',
      email: 'alan@university.edu',
      password: 'SecurePassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    studentUser = await User.create({
      name: 'Grace Hopper',
      email: 'grace@student.edu',
      password: 'StudentPass123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@platform.edu',
      password: 'AdminPassword123!',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: ['courses.read', 'courses.publish', 'courses.review', 'courses.approve'],
    });

    tokenA = tokenService.generateAccessToken(instructorA);
    tokenB = tokenService.generateAccessToken(instructorB);
    studentToken = tokenService.generateAccessToken(studentUser);
    adminToken = tokenService.generateAccessToken(adminUser);
  });

  // Test 1: Course Creation & Ownership
  it('Test 1: Instructor creates course -> saved in MongoDB with status DRAFT, isDeleted false, owned by authenticated instructor', async () => {
    const coursePayload = {
      title: 'Full Stack Web Engineering',
      slug: 'full-stack-web-engineering',
      shortDescription: 'Master modern full-stack web applications and architectures.',
      description: 'Comprehensive curriculum covering Node, React, MongoDB, Next.js, and enterprise microservices.',
      category: 'Web Development',
      difficulty: 'INTERMEDIATE',
      instructorId: instructorB._id.toString(), // Attacker attempts IDOR: backend must ignore this!
    };

    const res = await request(app)
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(coursePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const createdCourse = res.body.data.course || res.body.data;
    expect(createdCourse.title).toBe('Full Stack Web Engineering');
    expect(createdCourse.status).toBe('DRAFT');
    expect(createdCourse.isDeleted).toBe(false);

    // IDOR protection: owned by authenticated instructorA, NOT instructorB
    expect(createdCourse.instructor.toString()).toBe(instructorA._id.toString());

    // Also check database document directly
    const dbCourse = await Course.findById(createdCourse._id);
    expect(dbCourse).not.toBeNull();
    expect(dbCourse.instructor.toString()).toBe(instructorA._id.toString());
    expect(dbCourse.status).toBe('DRAFT');
    expect(dbCourse.isDeleted).toBe(false);
  });

  // Test 2: Persistence & Dashboard Refetch
  it('Test 2: Instructor course dashboard refetch returns the newly created course with items and courses array', async () => {
    const course = await Course.create({
      title: 'Distributed Systems Architecture',
      slug: 'distributed-systems-arch',
      shortDescription: 'Deep dive into consensus, replication, and distributed storage systems.',
      description: 'Long description of distributed systems concepts and practical implementations.',
      category: 'Computer Science',
      difficulty: 'ADVANCED',
      status: 'DRAFT',
      isPublished: false,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    const res = await request(app)
      .get('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify both items and courses alias exist in response
    const coursesList = res.body.courses || res.body.data.courses || res.body.data.items;
    expect(Array.isArray(coursesList)).toBe(true);
    expect(coursesList.length).toBe(1);
    expect(coursesList[0]._id.toString()).toBe(course._id.toString());
    expect(coursesList[0].status).toBe('DRAFT');
  });

  // Test 3: Multi-Instructor Isolation
  it('Test 3: Another instructor (Instructor B) does NOT see Instructor A course', async () => {
    await Course.create({
      title: 'Compiler Construction',
      slug: 'compiler-construction',
      shortDescription: 'Lexing, parsing, ASTs, and code generation principles.',
      description: 'Build your own programming language compiler from scratch using ASTs and bytecodes.',
      category: 'Computer Science',
      status: 'DRAFT',
      isPublished: false,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    const res = await request(app)
      .get('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const coursesList = res.body.courses || res.body.data.courses || res.body.data.items;
    expect(coursesList.length).toBe(0);
  });

  // Test 4: Student Visibility — DRAFT Courses are Hidden
  it('Test 4: Student cannot see DRAFT course in course catalog or by slug', async () => {
    const draftCourse = await Course.create({
      title: 'Cloud Native Microservices',
      slug: 'cloud-native-microservices',
      shortDescription: 'Build enterprise microservices with Kubernetes and Docker.',
      description: 'Comprehensive course covering microservices design patterns and container orchestration.',
      category: 'Cloud Computing',
      status: 'DRAFT',
      isPublished: false,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    // Public catalog check
    const listRes = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    const catalogItems = listRes.body.data.items || [];
    const foundInCatalog = catalogItems.find((c) => c._id.toString() === draftCourse._id.toString());
    expect(foundInCatalog).toBeUndefined();

    // Direct slug lookup check
    const slugRes = await request(app)
      .get(`/api/v1/courses/${draftCourse.slug}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(slugRes.status).toBe(404);
    expect(slugRes.body.errorCode).toBe('COURSE_NOT_FOUND');
  });

  // Test 5 & 6: Publish & Unpublish Lifecycle
  it('Test 5 & 6: Instructor publishes course -> visible to student; unpublishes course -> hidden from student', async () => {
    const course = await Course.create({
      title: 'Full Stack Mastery With Next.js',
      slug: 'full-stack-mastery-nextjs',
      shortDescription: 'Master modern full-stack web applications and architectures.',
      description: 'Comprehensive curriculum covering Node, React, MongoDB, Next.js, and enterprise microservices.',
      category: 'Web Development',
      status: 'DRAFT',
      isPublished: false,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    const moduleDoc = await Module.create({
      courseId: course._id,
      title: 'Module 1: Foundations',
      order: 1,
    });

    await Lesson.create({
      courseId: course._id,
      moduleId: moduleDoc._id,
      title: 'Lesson 1: Introduction',
      slug: 'lesson-1-intro',
      type: 'ARTICLE',
      isPublished: true,
      order: 1,
    });

    // Publish course
    const pubRes = await request(app)
      .post(`/api/v1/instructor/courses/${course._id}/publish`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.success).toBe(true);

    // Test 5: Student now sees published course
    const studentCatRes = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentCatRes.status).toBe(200);
    const pubCatalog = studentCatRes.body.data.items || [];
    expect(pubCatalog.some((c) => c._id.toString() === course._id.toString())).toBe(true);

    const studentSlugRes = await request(app)
      .get(`/api/v1/courses/${course.slug}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentSlugRes.status).toBe(200);
    expect(studentSlugRes.body.data.title).toBe(course.title);

    // Test 6: Instructor unpublishes course
    const unpubRes = await request(app)
      .post(`/api/v1/instructor/courses/${course._id}/unpublish`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(unpubRes.status).toBe(200);

    // Verify student no longer sees unpublished course
    const unpubCatRes = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`);

    const unpubCatalog = unpubCatRes.body.data.items || [];
    expect(unpubCatalog.some((c) => c._id.toString() === course._id.toString())).toBe(false);

    const unpubSlugRes = await request(app)
      .get(`/api/v1/courses/${course.slug}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(unpubSlugRes.status).toBe(404);
  });

  // Test 7 & 8: Deletion by Instructor -> Hidden Permanently from Student
  it('Test 7 & 8: Deleted course disappears from student catalog and direct URL returns 404', async () => {
    const course = await Course.create({
      title: 'DevOps and Continuous Delivery',
      slug: 'devops-continuous-delivery',
      shortDescription: 'Learn CI/CD pipelines, container orchestration, and monitoring.',
      description: 'Complete hands-on DevOps guide with real-world automated pipelines and deployment.',
      category: 'DevOps',
      status: 'PUBLISHED',
      isPublished: true,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    // Delete course
    const delRes = await request(app)
      .delete(`/api/v1/courses/${course._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(delRes.status).toBe(200);

    // Check student catalog
    const catRes = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`);

    const items = catRes.body.data.items || [];
    expect(items.some((c) => c._id.toString() === course._id.toString())).toBe(false);

    // Check direct slug URL
    const slugRes = await request(app)
      .get(`/api/v1/courses/${course.slug}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(slugRes.status).toBe(404);
    expect(slugRes.body.errorCode).toBe('COURSE_NOT_FOUND');
  });

  // Test 9 & 10: Admin Management
  it('Test 9 & 10: Admin can see courses across states (DRAFT/PUBLISHED) and can delete any course', async () => {
    const course = await Course.create({
      title: 'Security Operations & Incident Response',
      slug: 'secops-incident-response',
      shortDescription: 'Defensive cybersecurity, threat hunting, and log forensics.',
      description: 'Hands-on security operations training covering SIEM, forensics, and incident containment.',
      category: 'Cybersecurity',
      status: 'DRAFT',
      isPublished: false,
      isDeleted: false,
      instructor: instructorA._id,
      version: 1,
    });

    // Test 9: Admin sees the draft course in /api/v1/admin/courses
    const adminListRes = await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminListRes.status).toBe(200);
    const adminCourses = adminListRes.body.data.courses || adminListRes.body.data.items || adminListRes.body.data;
    const found = adminCourses.find((c) => c._id.toString() === course._id.toString());
    expect(found).toBeDefined();
    expect(found.status).toBe('DRAFT');

    // Test 10: Admin deletes the course
    const adminDelRes = await request(app)
      .delete(`/api/v1/courses/${course._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminDelRes.status).toBe(200);

    // Verify course is soft-deleted in DB and automatically excluded by default
    const dbCourse = await Course.findOne({ _id: course._id, includeDeleted: true });
    expect(dbCourse).not.toBeNull();
    expect(dbCourse.isDeleted).toBe(true);

    const normalQueryCourse = await Course.findById(course._id);
    expect(normalQueryCourse).toBeNull(); // Automatically filtered out by pre hook

    // Student cannot access
    const slugRes = await request(app)
      .get(`/api/v1/courses/${course.slug}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(slugRes.status).toBe(404);
  });
});
