/**
 * Seed script for Local Development Users & Courses
 * WARNING: FOR LOCAL DEVELOPMENT ONLY. NEVER RUN OR USE IN PRODUCTION.
 */
const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const { Course } = require('../models/course.model');
const Module = require('../models/module.model');
const { Lesson } = require('../models/lesson.model');
const { Enrollment } = require('../models/enrollment.model');
const Progress = require('../models/progress.model');
const Assessment = require('../models/assessment.model');
const Question = require('../models/question.model');
const AssessmentAttempt = require('../models/assessmentAttempt.model');
const env = require('../config/env');

const seedData = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB.');

    // 1. Clear existing collections
    console.log('[Seed] Clearing previous development data...');
    await Promise.all([
      User.deleteMany({ email: { $in: ['student@example.com', 'instructor@example.com', 'admin@example.com'] } }),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
      Enrollment.deleteMany({}),
      Progress.deleteMany({}),
      Assessment.deleteMany({}),
      Question.deleteMany({}),
      AssessmentAttempt.deleteMany({}),
    ]);

    // 2. Create Users
    const student = await User.create({
      name: 'Alex Rivera (Demo Student)',
      email: 'student@example.com',
      password: 'StudentPass123!',
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    const instructor = await User.create({
      name: 'Prof. Sarah Jenkins (Demo Instructor)',
      email: 'instructor@example.com',
      password: 'InstructorPass123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    const admin = await User.create({
      name: 'Marcus Vance (Demo Admin)',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 3. Create Course 1: Full Stack Web Development (Published)
    const course1 = await Course.create({
      title: 'Full Stack Software Engineering',
      slug: 'full-stack-software-engineering',
      shortDescription: 'Master modern web development from HTML/CSS to advanced React, Node.js, and MongoDB.',
      description: 'A comprehensive, career-focused curriculum guiding you through modern software engineering. Learn frontend design patterns, asynchronous JavaScript, scalable RESTful API architecture with Express, and document database modeling with MongoDB.',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
      category: 'Web Development',
      difficulty: 'BEGINNER',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
      language: 'English',
      duration: '42 hours',
      instructor: instructor._id,
      status: 'PUBLISHED',
      isPublished: true,
      featured: true,
      pricingType: 'FREE',
      requirements: [
        'A computer with modern web browser and internet connection',
        'Basic familiarity with computer operations and terminal',
      ],
      learningOutcomes: [
        'Build production-ready web applications from scratch',
        'Master JavaScript ES6+, closures, event loop, and asynchronous patterns',
        'Create secure backend REST APIs with Express and Mongoose',
        'Deploy scalable full stack apps with cloud persistence',
      ],
    });

    // Modules for Course 1
    const m1_1 = await Module.create({
      courseId: course1._id,
      title: 'Module 1: Modern JavaScript Foundations',
      description: 'Core language semantics, closures, scope chains, and ESNext features.',
      order: 1,
      isPublished: true,
    });

    const m1_2 = await Module.create({
      courseId: course1._id,
      title: 'Module 2: Asynchronous Programming & Event Loop',
      description: 'Microtasks, Macrotasks, Promises, and mastering Async/Await.',
      order: 2,
      isPublished: true,
    });

    const m1_3 = await Module.create({
      courseId: course1._id,
      title: 'Module 3: React Architecture & Component State',
      description: 'Hooks, virtual DOM reconciliation, and unidirectional data flow.',
      order: 3,
      isPublished: true,
    });

    // Lessons for Course 1
    // Module 1 Lessons
    const l1_1 = await Lesson.create({
      courseId: course1._id,
      moduleId: m1_1._id,
      title: 'Introduction to Modern Full Stack Development',
      slug: 'intro-to-fullstack',
      description: 'Architectural overview of client-server systems and career pathways.',
      type: 'VIDEO',
      order: 1,
      duration: 18,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      content: '# Full Stack Architecture Overview\n\nIn modern web development, applications are decoupled into frontends (Next.js/React) and backends (Express/Node.js). We will walk through the complete client-server lifecycle, HTTP request pipeline, and database transactions.',
      resources: [
        { title: 'Full Stack Roadmap PDF', url: 'https://developer.mozilla.org', type: 'PDF' },
        { title: 'Starter Codebase Repository', url: 'https://github.com', type: 'GITHUB' },
      ],
      isPreview: true, // Free Preview Lesson
      isPublished: true,
    });

    const l1_2 = await Lesson.create({
      courseId: course1._id,
      moduleId: m1_1._id,
      title: 'Deep Dive into Closures and Lexical Scope',
      slug: 'closures-lexical-scope',
      description: 'Understand how JavaScript executes functions and retains scope references.',
      type: 'ARTICLE',
      order: 2,
      duration: 22,
      videoUrl: null,
      content: '# Understanding Closures\n\nA closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In JavaScript, closures are created every time a function is created, at function creation time.\n\n```javascript\nfunction makeCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```',
      resources: [
        { title: 'MDN Closures Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', type: 'DOCS' },
      ],
      isPreview: false,
      isPublished: true,
    });

    // Module 2 Lessons
    const l1_3 = await Lesson.create({
      courseId: course1._id,
      moduleId: m1_2._id,
      title: 'Mastering Async/Await & Microtask Queues',
      slug: 'async-await-microtasks',
      description: 'Write clean asynchronous code and understand the Node.js event loop.',
      type: 'VIDEO',
      order: 1,
      duration: 28,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      content: '# Async/Await & Microtasks\n\nThe async and await keywords enable asynchronous, promise-based behavior to be written in a cleaner, procedural style.\n\n```javascript\nasync function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    const data = await response.json();\n    return data;\n  } catch (err) {\n    console.error("Failed to load user", err);\n  }\n}\n```',
      resources: [
        { title: 'Event Loop Visualizer', url: 'https://latentflip.com/loupe', type: 'LINK' },
      ],
      isPreview: false,
      isPublished: true,
    });

    const l1_4 = await Lesson.create({
      courseId: course1._id,
      moduleId: m1_2._id,
      title: 'Error Handling Patterns in Asynchronous Code',
      slug: 'async-error-handling',
      description: 'Robust try/catch patterns, promise rejection tracking, and retry handlers.',
      type: 'ARTICLE',
      order: 2,
      duration: 15,
      videoUrl: null,
      content: '# Asynchronous Error Handling\n\nHandling exceptions gracefully ensures high-availability applications that never crash silently.',
      resources: [],
      isPreview: false,
      isPublished: true,
    });

    // Module 3 Lessons
    const l1_5 = await Lesson.create({
      courseId: course1._id,
      moduleId: m1_3._id,
      title: 'React 18 Component Lifecycle & Hooks',
      slug: 'react-lifecycle-hooks',
      description: 'Building interactive user interfaces with useState, useEffect, and custom hooks.',
      type: 'VIDEO',
      order: 1,
      duration: 35,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      content: '# React 18 Hooks\n\nHooks let you use state and other React features without writing a class component.',
      resources: [],
      isPreview: false,
      isPublished: true,
    });

    // 4. Create Course 2: React & Next.js Masterclass (Published)
    const course2 = await Course.create({
      title: 'React 18 & Next.js Architecture Masterclass',
      slug: 'react-18-nextjs-masterclass',
      shortDescription: 'Build high-performance web applications using App Router, Server Components, and Tailwind.',
      description: 'Comprehensive guide to Next.js App Router architecture, server-side rendering, streaming, and state management.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
      category: 'Frontend',
      difficulty: 'INTERMEDIATE',
      skills: ['React', 'Next.js', 'Server Components', 'Tailwind CSS', 'TypeScript Basics'],
      language: 'English',
      duration: '28 hours',
      instructor: instructor._id,
      status: 'PUBLISHED',
      isPublished: true,
      featured: true,
      pricingType: 'FREE',
      requirements: ['Solid understanding of JavaScript ES6+'],
      learningOutcomes: [
        'Master React Server Components and Client Components boundary separation',
        'Implement SSR, SSG, and ISR rendering patterns in Next.js',
      ],
    });

    const m2_1 = await Module.create({
      courseId: course2._id,
      title: 'Module 1: Next.js App Router Architecture',
      description: 'Layouts, pages, route handlers, and streaming metadata.',
      order: 1,
      isPublished: true,
    });

    await Lesson.create({
      courseId: course2._id,
      moduleId: m2_1._id,
      title: 'App Router File Conventions & Layout Nesting',
      slug: 'app-router-conventions',
      description: 'Understanding layout.jsx, page.jsx, and error boundaries.',
      type: 'VIDEO',
      order: 1,
      duration: 25,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      content: '# Next.js File Hierarchy\n\nNext.js uses a file-system based router where folders define routes.',
      isPreview: true,
      isPublished: true,
    });

    // 5. Create Course 3: Node.js & Microservices Architecture (Published)
    const course3 = await Course.create({
      title: 'Node.js & Microservices Architecture',
      slug: 'nodejs-microservices-architecture',
      shortDescription: 'Design, containerize, and deploy scalable microservice architectures with Node and Docker.',
      description: 'Learn enterprise system design, queue-based background processing, caching with Redis, and container orchestration.',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
      category: 'Backend',
      difficulty: 'ADVANCED',
      skills: ['Node.js', 'Express', 'Microservices', 'Docker', 'Redis', 'BullMQ'],
      language: 'English',
      duration: '34 hours',
      instructor: instructor._id,
      status: 'PUBLISHED',
      isPublished: true,
      featured: false,
      pricingType: 'FREE',
      requirements: ['Experience with Express REST APIs and databases'],
      learningOutcomes: ['Design decoupled microservices using asynchronous messaging queues'],
    });

    const m3_1 = await Module.create({
      courseId: course3._id,
      title: 'Module 1: Message Queues & Event-Driven Architecture',
      description: 'Decoupling services with Redis and message brokers.',
      order: 1,
      isPublished: true,
    });

    await Lesson.create({
      courseId: course3._id,
      moduleId: m3_1._id,
      title: 'Background Job Queues with BullMQ & Redis',
      slug: 'background-queues-bullmq',
      description: 'Managing workers, retries, and rate limiting in Node.js.',
      type: 'VIDEO',
      order: 1,
      duration: 30,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      content: '# BullMQ Architecture\n\nMessage queues allow background processing of heavy computations.',
      isPreview: true,
      isPublished: true,
    });

    // 6. Create Course 4: Draft Course (Unpublished - not visible in catalog)
    await Course.create({
      title: 'System Design for High-Scale Applications',
      slug: 'system-design-high-scale',
      shortDescription: 'Draft course under curriculum faculty review.',
      description: 'Deep dive into load balancing, CAP theorem, database sharding, and caching strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
      category: 'System Design',
      difficulty: 'ADVANCED',
      skills: ['System Design', 'Scalability', 'Load Balancing', 'Sharding'],
      language: 'English',
      duration: '20 hours',
      instructor: instructor._id,
      status: 'DRAFT',
      isPublished: false,
      featured: false,
      pricingType: 'FREE',
    });

    // 7. Seed Active Enrollment for Demo Student in Course 1
    const demoEnrollment = await Enrollment.create({
      studentId: student._id,
      courseId: course1._id,
      status: 'ACTIVE',
      progressPercentage: 40,
      lastLessonId: l1_3._id,
      enrolledAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    });

    // Seed Completed Progress for Lessons 1 & 2
    await Progress.create({
      studentId: student._id,
      courseId: course1._id,
      lessonId: l1_1._id,
      isCompleted: true,
      completedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      lastPosition: 18 * 60,
      timeSpent: 18 * 60,
    });

    await Progress.create({
      studentId: student._id,
      courseId: course1._id,
      lessonId: l1_2._id,
      isCompleted: true,
      completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      lastPosition: 0,
      timeSpent: 22 * 60,
    });

    // Seed in-progress on Lesson 3
    await Progress.create({
      studentId: student._id,
      courseId: course1._id,
      lessonId: l1_3._id,
      isCompleted: false,
      lastPosition: 340, // 5m 40s
      timeSpent: 400,
    });

    // ==========================================
    // 6. Seed Assessments & Questions (Phase 5)
    // ==========================================
    console.log('[Seed] Generating assessments and questions...');

    // Assessment 1: JavaScript & Web Core Assessment (Published)
    const ass1 = await Assessment.create({
      courseId: course1._id,
      moduleId: m1_1._id,
      title: 'JavaScript & Web Core Assessment',
      slug: 'javascript-web-core-assessment',
      description: 'Test your foundational knowledge of JavaScript types, scoping, prototype chains, and DOM fundamentals.',
      instructions: 'You have 20 minutes to complete 7 questions. A minimum score of 70% is required to pass.',
      type: 'MODULE_ASSESSMENT',
      difficulty: 'Beginner',
      duration: 20,
      passingScore: 70,
      totalMarks: 7,
      maxAttempts: 3,
      status: 'PUBLISHED',
      isPublished: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      createdBy: instructor._id,
    });

    const q1_list = await Question.create([
      {
        assessmentId: ass1._id,
        question: 'What is the return value of typeof null in JavaScript?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: '"object"' },
          { id: 'b', text: '"null"' },
          { id: 'c', text: '"undefined"' },
          { id: 'd', text: '"number"' },
        ],
        correctAnswers: ['a'],
        explanation: 'Due to a historical bug in JavaScript from its earliest implementation, typeof null evaluates to "object".',
        marks: 1,
        order: 1,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'Which of the following values are inherently falsy in JavaScript?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: '0 (number zero)' },
          { id: 'b', text: '"" (empty string)' },
          { id: 'c', text: 'false (boolean)' },
          { id: 'd', text: '[] (empty array)' },
        ],
        correctAnswers: ['a', 'b', 'c'],
        explanation: 'In JavaScript, 0, "", and false are falsy. Empty arrays [] and empty objects {} are truthy references.',
        marks: 1,
        order: 2,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'Variables declared with "const" can have their binding reassigned after declaration.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['false'],
        explanation: '"const" creates an immutable identifier binding; attempting to reassign causes a TypeError.',
        marks: 1,
        order: 3,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'What is the primary difference between double equals (==) and triple equals (===)?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: '=== compares both value and type without coercion; == performs type coercion' },
          { id: 'b', text: '== compares memory address; === compares value only' },
          { id: 'c', text: 'There is no difference in ES6+' },
          { id: 'd', text: '=== only works on primitive strings' },
        ],
        correctAnswers: ['a'],
        explanation: 'Strict equality (===) does not coerce operands, ensuring predictable type and value matching.',
        marks: 1,
        order: 4,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'Which of the following array methods mutate the original array in-place?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'push()' },
          { id: 'b', text: 'pop()' },
          { id: 'c', text: 'slice()' },
          { id: 'd', text: 'splice()' },
        ],
        correctAnswers: ['a', 'b', 'd'],
        explanation: 'push, pop, and splice mutate the original array. slice returns a shallow copy without mutation.',
        marks: 1,
        order: 5,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'JavaScript is fundamentally a single-threaded language with an asynchronous non-blocking event loop.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'The V8 JavaScript runtime executes JavaScript code on a single call stack supported by the libuv event loop.',
        marks: 1,
        order: 6,
        isActive: true,
      },
      {
        assessmentId: ass1._id,
        question: 'In standard DOM event propagation, which phase occurs first during an event dispatch?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Capturing phase (Window down to target)' },
          { id: 'b', text: 'Target phase' },
          { id: 'c', text: 'Bubbling phase (Target up to Window)' },
          { id: 'd', text: 'Mutation phase' },
        ],
        correctAnswers: ['a'],
        explanation: 'Event dispatch proceeds in three phases: Capturing -> Target -> Bubbling.',
        marks: 1,
        order: 7,
        isActive: true,
      },
    ]);

    // Assessment 2: React 18 & Component Architecture Checkpoint (Published)
    const ass2 = await Assessment.create({
      courseId: course2._id,
      moduleId: m2_1._id,
      title: 'React 18 & Component Architecture Checkpoint',
      slug: 'react-18-component-architecture-checkpoint',
      description: 'Evaluate your understanding of hooks, rendering lifecycles, memoization, and concurrent mode features in React 18.',
      instructions: 'Answer all 7 questions within 25 minutes. 75% required to pass.',
      type: 'QUIZ',
      difficulty: 'Intermediate',
      duration: 25,
      passingScore: 75,
      totalMarks: 7,
      maxAttempts: 2,
      status: 'PUBLISHED',
      isPublished: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      createdBy: instructor._id,
    });

    await Question.create([
      {
        assessmentId: ass2._id,
        question: 'What is the primary purpose of the useEffect hook in functional components?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Synchronize component lifecycle with external systems or side effects' },
          { id: 'b', text: 'Store persistent mutable values without triggering re-render' },
          { id: 'c', text: 'Compile JSX to HTML string' },
          { id: 'd', text: 'Handle global CSS styling' },
        ],
        correctAnswers: ['a'],
        explanation: 'useEffect lets you perform side effects (subscriptions, timers, DOM mutations) synchronized with props/state changes.',
        marks: 1,
        order: 1,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'Which of the following React built-in hooks are designed for performance optimization or state caching?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'useMemo' },
          { id: 'b', text: 'useCallback' },
          { id: 'c', text: 'useTransition' },
          { id: 'd', text: 'useRef' },
        ],
        correctAnswers: ['a', 'b', 'c'],
        explanation: 'useMemo caches expensive calculations, useCallback caches function definitions, and useTransition prioritizes non-blocking UI transitions.',
        marks: 1,
        order: 2,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'State updates scheduled via useState setter functions are always synchronously committed to the DOM.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['false'],
        explanation: 'React batches state updates asynchronously to optimize render performance and avoid duplicate paint cycles.',
        marks: 1,
        order: 3,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'Which factors will trigger a functional React component to re-render?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'Internal state variable value change' },
          { id: 'b', text: 'New props received from parent' },
          { id: 'c', text: 'Parent component re-rendering' },
          { id: 'd', text: 'Updating a useRef.current value' },
        ],
        correctAnswers: ['a', 'b', 'c'],
        explanation: 'State changes, prop updates, and parent renders trigger render cycles. Mutating a ref does NOT cause a re-render.',
        marks: 1,
        order: 4,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'According to the Rules of Hooks, where is it legal to call a React hook?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Only at the top level of React functional components or custom hooks' },
          { id: 'b', text: 'Inside conditional if statements' },
          { id: 'c', text: 'Inside nested for loops' },
          { id: 'd', text: 'Inside plain event handler functions' },
        ],
        correctAnswers: ['a'],
        explanation: 'Hooks must be called unconditionally at the top level so React preserves hook call order between renders.',
        marks: 1,
        order: 5,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'The useId hook in React 18 produces deterministic IDs safe for server and client hydration.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'useId is engineered to generate unique, identical IDs across SSR server output and client hydration.',
        marks: 1,
        order: 6,
        isActive: true,
      },
      {
        assessmentId: ass2._id,
        question: 'React Server Components (RSC) bundle their runtime JavaScript and dependencies directly into client bundles.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['false'],
        explanation: 'RSC execute only on the server, leaving 0 bytes of component code in the client bundle.',
        marks: 1,
        order: 7,
        isActive: true,
      },
    ]);

    // Assessment 3: Node.js & Microservices Engineering Assessment (Published)
    const ass3 = await Assessment.create({
      courseId: course3._id,
      moduleId: m3_1._id,
      title: 'Node.js & Microservices Engineering Assessment',
      slug: 'nodejs-microservices-engineering-assessment',
      description: 'Comprehensive evaluation of Node runtime internals, stream pipelines, clustering, and distributed microservice patterns.',
      instructions: 'Duration: 30 minutes. Passing threshold is 80%. Maximum 2 attempts.',
      type: 'COURSE_ASSESSMENT',
      difficulty: 'Advanced',
      duration: 30,
      passingScore: 80,
      totalMarks: 6,
      maxAttempts: 2,
      status: 'PUBLISHED',
      isPublished: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      createdBy: instructor._id,
    });

    await Question.create([
      {
        assessmentId: ass3._id,
        question: 'Which phase of the libuv event loop handles setTimeout and setInterval callbacks?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Timers phase' },
          { id: 'b', text: 'Poll phase' },
          { id: 'c', text: 'Check phase (setImmediate)' },
          { id: 'd', text: 'Close callbacks phase' },
        ],
        correctAnswers: ['a'],
        explanation: 'The timers phase executes callbacks scheduled by setTimeout() and setInterval().',
        marks: 1,
        order: 1,
        isActive: true,
      },
      {
        assessmentId: ass3._id,
        question: 'Which communication protocols are standard for synchronous and asynchronous microservice IPC?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'gRPC with HTTP/2' },
          { id: 'b', text: 'REST APIs over HTTP/1.1' },
          { id: 'c', text: 'Message brokers (RabbitMQ / Apache Kafka)' },
          { id: 'd', text: 'Shared disk file polling' },
        ],
        correctAnswers: ['a', 'b', 'c'],
        explanation: 'gRPC, REST, and distributed message queues represent standard microservice communication patterns.',
        marks: 1,
        order: 2,
        isActive: true,
      },
      {
        assessmentId: ass3._id,
        question: 'The Node.js Cluster module allows multiple child processes to share the same server port through IPC socket handoff.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'The master process listens on the port and distributes incoming connections across workers using round-robin.',
        marks: 1,
        order: 3,
        isActive: true,
      },
      {
        assessmentId: ass3._id,
        question: 'What are the four fundamental stream types provided by Node.js stream core module?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'Readable' },
          { id: 'b', text: 'Writable' },
          { id: 'c', text: 'Duplex' },
          { id: 'd', text: 'Transform' },
        ],
        correctAnswers: ['a', 'b', 'c', 'd'],
        explanation: 'Node.js defines exactly four abstract stream types: Readable, Writable, Duplex, and Transform.',
        marks: 1,
        order: 4,
        isActive: true,
      },
      {
        assessmentId: ass3._id,
        question: 'Which architectural pattern is recommended for maintaining data consistency across independent microservice databases without distributed two-phase commit locking?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Monolithic Shared Database' },
          { id: 'b', text: 'Saga Pattern (Choreographed or Orchestrated compensating transactions)' },
          { id: 'c', text: 'Active-Active Synchronous Replication' },
          { id: 'd', text: 'B-Tree Multi-tenant Lock' },
        ],
        correctAnswers: ['b'],
        explanation: 'The Saga pattern decomposes distributed transactions into a sequence of local transactions with compensating rollbacks.',
        marks: 1,
        order: 5,
        isActive: true,
      },
      {
        assessmentId: ass3._id,
        question: 'Worker threads in Node.js (worker_threads module) share the exact same V8 isolate and memory heap as the main thread.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['false'],
        explanation: 'Each worker thread runs in its own V8 isolate with its own memory heap, communicating via MessagePort or SharedArrayBuffer.',
        marks: 1,
        order: 6,
        isActive: true,
      },
    ]);

    // Assessment 4: Modern System Design & Scalability Practice Test (Published)
    const ass4 = await Assessment.create({
      courseId: course1._id,
      title: 'Modern System Design & Scalability Practice Test',
      slug: 'system-design-scalability-practice-test',
      description: 'Practice high-scale architectural design principles: caching tiers, consistent hashing, load balancing, and rate limiting algorithms.',
      instructions: 'Unlimited attempts allowed. Take this practice test anytime to assess system engineering readiness.',
      type: 'PRACTICE_TEST',
      difficulty: 'Advanced',
      duration: 45,
      passingScore: 70,
      totalMarks: 6,
      maxAttempts: 0, // 0 = unlimited
      status: 'PUBLISHED',
      isPublished: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      createdBy: instructor._id,
    });

    await Question.create([
      {
        assessmentId: ass4._id,
        question: 'According to Eric Brewer\'s CAP theorem, what does a distributed system guarantee during a network partition (P)?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Both Consistency and Availability simultaneously' },
          { id: 'b', text: 'Neither Consistency nor Availability' },
          { id: 'c', text: 'A trade-off choosing either Consistency (CP) or Availability (AP)' },
          { id: 'd', text: 'Infinite horizontal throughput' },
        ],
        correctAnswers: ['c'],
        explanation: 'When a network partition occurs, a distributed system must choose between returning consistent data or remaining available.',
        marks: 1,
        order: 1,
        isActive: true,
      },
      {
        assessmentId: ass4._id,
        question: 'Which algorithms are commonly utilized in Layer 4 and Layer 7 load balancers to distribute traffic across application servers?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'Round Robin / Weighted Round Robin' },
          { id: 'b', text: 'Least Connections / Least Response Time' },
          { id: 'c', text: 'IP Hash / Consistent Hashing' },
          { id: 'd', text: 'QuickSort Inversion' },
        ],
        correctAnswers: ['a', 'b', 'c'],
        explanation: 'Round Robin, Least Connections, and Hashing schemes are standard load balancing algorithms.',
        marks: 1,
        order: 2,
        isActive: true,
      },
      {
        assessmentId: ass4._id,
        question: 'Redis is exclusively an ephemeral in-memory cache and provides zero mechanisms for disk persistence.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['false'],
        explanation: 'Redis supports point-in-time snapshots (RDB) and append-only file logging (AOF) for durable persistence.',
        marks: 1,
        order: 3,
        isActive: true,
      },
      {
        assessmentId: ass4._id,
        question: 'Which data structure is predominantly used by relational databases (like PostgreSQL/MySQL) for standard B-Tree indexes?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'B+ Tree' },
          { id: 'b', text: 'Linked List' },
          { id: 'c', text: 'Red-Black Tree' },
          { id: 'd', text: 'Min-Heap' },
        ],
        correctAnswers: ['a'],
        explanation: 'B+ Trees keep all records in leaf nodes linked sequentially, making range scans and point queries highly efficient on disk blocks.',
        marks: 1,
        order: 4,
        isActive: true,
      },
      {
        assessmentId: ass4._id,
        question: 'Which algorithms are widely implemented to enforce rate limiting on high-throughput web APIs?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'Token Bucket' },
          { id: 'b', text: 'Leaky Bucket' },
          { id: 'c', text: 'Sliding Window Counter / Log' },
          { id: 'd', text: 'Fixed Window Counter' },
        ],
        correctAnswers: ['a', 'b', 'c', 'd'],
        explanation: 'Token bucket, Leaky bucket, Fixed window, and Sliding window are the 4 standard API rate-limiting algorithms.',
        marks: 1,
        order: 5,
        isActive: true,
      },
      {
        assessmentId: ass4._id,
        question: 'Consistent hashing minimizes key remapping to approximately K/N keys when a cache node is added or removed from an N-node cluster.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'Unlike simple modulo hashing (hash(key) % N), consistent hashing ensures only adjacent keys are rebalanced when topology changes.',
        marks: 1,
        order: 6,
        isActive: true,
      },
    ]);

    // Assessment 5: Cloud Native Security & Docker Containers [DRAFT - Upcoming]
    const ass5 = await Assessment.create({
      courseId: course3._id,
      title: 'Cloud Native Security & Docker Containers [Draft]',
      slug: 'cloud-native-security-docker-draft',
      description: 'Upcoming assessment covering container image hardening, multi-stage Docker builds, and Kubernetes RBAC.',
      instructions: 'Draft assessment for previewing upcoming curriculum module.',
      type: 'QUIZ',
      difficulty: 'Intermediate',
      duration: 15,
      passingScore: 70,
      totalMarks: 5,
      maxAttempts: 3,
      status: 'DRAFT',
      isPublished: false,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      createdBy: instructor._id,
    });

    await Question.create([
      {
        assessmentId: ass5._id,
        question: 'Using multi-stage Docker builds reduces the final container image size and minimizes CVE vulnerability attack surfaces.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'Multi-stage builds allow compiling in build stages without copying compilers and development dependencies into production images.',
        marks: 1,
        order: 1,
        isActive: true,
      },
      {
        assessmentId: ass5._id,
        question: 'What is the recommended security best practice regarding the Linux user running processes inside a production container?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Run as a dedicated non-root user with minimal privileges (USER appuser)' },
          { id: 'b', text: 'Always run as root to allow package installation at runtime' },
          { id: 'c', text: 'Run as sudoer' },
          { id: 'd', text: 'User specification has no effect on container breakouts' },
        ],
        correctAnswers: ['a'],
        explanation: 'Running as non-root limits damage in the event of an application exploit or container escape vulnerability.',
        marks: 1,
        order: 2,
        isActive: true,
      },
      {
        assessmentId: ass5._id,
        question: 'Which of the following are secure patterns for supplying sensitive database passwords to production containers?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'Mounting secret files into memory (tmpfs) from HashiCorp Vault / AWS Secrets Manager' },
          { id: 'b', text: 'Kubernetes Secret projected volume' },
          { id: 'c', text: 'Baking secrets directly into the Git repository Dockerfile' },
          { id: 'd', text: 'Injecting as runtime environment variables from a dedicated secrets orchestrator' },
        ],
        correctAnswers: ['a', 'b', 'd'],
        explanation: 'Secrets should never be baked into Dockerfiles or committed to version control.',
        marks: 1,
        order: 3,
        isActive: true,
      },
      {
        assessmentId: ass5._id,
        question: 'Containers share the host operating system kernel, whereas Virtual Machines virtualize hardware and run isolated guest kernels.',
        type: 'TRUE_FALSE',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctAnswers: ['true'],
        explanation: 'Containers use Linux namespaces and cgroups to isolate processes on a shared host kernel.',
        marks: 1,
        order: 4,
        isActive: true,
      },
      {
        assessmentId: ass5._id,
        question: 'Which utility is an open-source CLI vulnerability scanner for container images, file systems, and Git repositories?',
        type: 'SINGLE_CHOICE',
        options: [
          { id: 'a', text: 'Webpack' },
          { id: 'b', text: 'Trivy' },
          { id: 'c', text: 'Babel' },
          { id: 'd', text: 'Prettier' },
        ],
        correctAnswers: ['b'],
        explanation: 'Aqua Security\'s Trivy is an industry-standard vulnerability scanner for container images.',
        marks: 1,
        order: 5,
        isActive: true,
      },
    ]);

    // Seed a submitted attempt for demo student on Assessment 1
    const demoAttempt = await AssessmentAttempt.create({
      studentId: student._id,
      assessmentId: ass1._id,
      startedAt: new Date(Date.now() - 2 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000 + 12 * 60 * 1000),
      status: 'SUBMITTED',
      score: 6,
      percentage: 86,
      passed: true,
      attemptNumber: 1,
      totalQuestions: 7,
      answeredQuestions: 7,
      correctAnswers: 6,
      incorrectAnswers: 1,
      timeSpent: 12 * 60,
      answers: [
        { questionId: q1_list[0]._id, selectedAnswers: ['a'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[1]._id, selectedAnswers: ['a', 'b', 'c'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[2]._id, selectedAnswers: ['false'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[3]._id, selectedAnswers: ['a'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[4]._id, selectedAnswers: ['a', 'b', 'd'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[5]._id, selectedAnswers: ['true'], isCorrect: true, marksAwarded: 1 },
        { questionId: q1_list[6]._id, selectedAnswers: ['c'], isCorrect: false, marksAwarded: 0 },
      ],
    });

    console.log('====================================================');
    console.log('       DEVELOPMENT SEED DATA GENERATED SUCCESSFULLY   ');
    console.log('====================================================');
    console.log('COURSES SEEDED:');
    console.log('  1. Full Stack Software Engineering (PUBLISHED, 3 modules, 5 lessons)');
    console.log('  2. React 18 & Next.js Masterclass (PUBLISHED, 1 module, 1 lesson)');
    console.log('  3. Node.js & Microservices Architecture (PUBLISHED, 1 module, 1 lesson)');
    console.log('  4. System Design for High-Scale Applications (DRAFT - hidden from public)');
    console.log('----------------------------------------------------');
    console.log('ASSESSMENTS SEEDED (Phase 5):');
    console.log('  1. JavaScript & Web Core Assessment (PUBLISHED, 7 questions)');
    console.log('  2. React 18 & Component Architecture Checkpoint (PUBLISHED, 7 questions)');
    console.log('  3. Node.js & Microservices Engineering Assessment (PUBLISHED, 6 questions)');
    console.log('  4. System Design & Scalability Practice Test (PUBLISHED, 6 questions)');
    console.log('  5. Cloud Native Security & Docker Containers [Draft] (DRAFT, 5 questions)');
    console.log('  Total questions seeded: 31');
    console.log('----------------------------------------------------');
    console.log('DEMO STUDENT ENROLLMENT & ASSESSMENTS:');
    console.log('  Student: student@example.com');
    console.log('  Course:  Full Stack Software Engineering (Progress: 40%)');
    console.log('  Passed Assessment: JavaScript & Web Core Assessment (86% - 6/7)');
    console.log('====================================================');

    await mongoose.disconnect();
    console.log('[Seed] Disconnected. Done.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
