const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Enrollment } = require('../src/models/enrollment.model');
const Assessment = require('../src/models/assessment.model');
const Question = require('../src/models/question.model');
const AssessmentAttempt = require('../src/models/assessmentAttempt.model');
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

describe('Assessment & Quiz System Integration Tests', () => {
  let studentUser;
  let otherStudent;
  let studentToken;
  let otherStudentToken;

  let publishedCourse;
  let publishedAssessment;
  let draftAssessment;

  let singleChoiceQ;
  let multipleChoiceQ;
  let trueFalseQ;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Assessment.deleteMany({}),
      Question.deleteMany({}),
      AssessmentAttempt.deleteMany({}),
    ]);

    // Create students
    studentUser = await User.create({
      name: 'Primary Student',
      email: 'primary@student.com',
      password: 'Password123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    otherStudent = await User.create({
      name: 'Other Student',
      email: 'other@student.com',
      password: 'Password123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    // Create instructor
    const instructorUser = await User.create({
      name: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'Password123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    studentToken = tokenService.generateAccessToken(studentUser);
    otherStudentToken = tokenService.generateAccessToken(otherStudent);

    // Create course and enrollment
    publishedCourse = await Course.create({
      title: 'Full Stack Development',
      slug: 'full-stack-dev',
      shortDescription: 'Comprehensive full stack track',
      description: 'Master full stack web development from frontend to backend',
      category: 'Web Development',
      difficulty: 'INTERMEDIATE',
      instructor: instructorUser._id,
      status: 'PUBLISHED',
      isPublished: true,
    });

    await Enrollment.create({
      studentId: studentUser._id,
      courseId: publishedCourse._id,
      status: 'ACTIVE',
    });

    // Create published assessment
    publishedAssessment = await Assessment.create({
      courseId: publishedCourse._id,
      title: 'JavaScript & React Assessment',
      slug: 'javascript-react-assessment',
      type: 'QUIZ',
      difficulty: 'Intermediate',
      duration: 30, // 30 minutes
      passingScore: 70, // 70%
      totalMarks: 3,
      maxAttempts: 2,
      status: 'PUBLISHED',
      isPublished: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
    });

    // Create draft assessment
    draftAssessment = await Assessment.create({
      courseId: publishedCourse._id,
      title: 'Draft Secret Quiz',
      slug: 'draft-secret-quiz',
      status: 'DRAFT',
      isPublished: false,
    });

    // Create questions
    singleChoiceQ = await Question.create({
      assessmentId: publishedAssessment._id,
      question: 'What is the virtual DOM in React?',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'a', text: 'A direct reference to the browser DOM' },
        { id: 'b', text: 'An in-memory lightweight representation of the real DOM' },
        { id: 'c', text: 'A database query language' },
      ],
      correctAnswers: ['b'],
      explanation: 'The virtual DOM is a node tree representation kept in memory.',
      marks: 1,
      order: 1,
      isActive: true,
    });

    multipleChoiceQ = await Question.create({
      assessmentId: publishedAssessment._id,
      question: 'Which of the following are primitive data types in JavaScript?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: 'String' },
        { id: 'b', text: 'Boolean' },
        { id: 'c', text: 'Array' },
      ],
      correctAnswers: ['a', 'b'],
      explanation: 'Strings and Booleans are primitives; Arrays are objects.',
      marks: 1,
      order: 2,
      isActive: true,
    });

    trueFalseQ = await Question.create({
      assessmentId: publishedAssessment._id,
      question: 'JavaScript is a single-threaded language.',
      type: 'TRUE_FALSE',
      options: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      correctAnswers: ['true'],
      explanation: 'JavaScript runs on a single main execution thread.',
      marks: 1,
      order: 3,
      isActive: true,
    });
  });

  describe('1. Assessment Discovery & Details', () => {
    it('should list only published assessments for students', async () => {
      const res = await request(app)
        .get('/api/v1/assessments')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.data.items;
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('JavaScript & React Assessment');
      expect(items.some((i) => i.title === 'Draft Secret Quiz')).toBe(false);
    });

    it('should fetch assessment details by slug or ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assessments/${publishedAssessment.slug}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('JavaScript & React Assessment');
      expect(res.body.data.questionCount).toBe(3);
    });

    it('should return 404 for draft assessment accessed by student', async () => {
      await request(app)
        .get(`/api/v1/assessments/${draftAssessment._id}`)
        .expect(404);
    });
  });

  describe('2. Start Attempt & Anti-Leakage Verification', () => {
    it('should start an attempt and return safe questions WITHOUT correctAnswers or explanations', async () => {
      const res = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.attempt).toBeDefined();
      expect(data.attempt.status).toBe('IN_PROGRESS');
      expect(data.questions.length).toBe(3);

      // Verify ZERO answer leakage
      data.questions.forEach((q) => {
        expect(q.correctAnswers).toBeUndefined();
        expect(q.explanation).toBeUndefined();
        expect(q.options).toBeDefined();
        expect(q.options.length).toBeGreaterThan(0);
      });
    });

    it('should restore existing in-progress attempt upon page refresh instead of creating duplicate', async () => {
      // First attempt start
      const firstRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const firstAttemptId = firstRes.body.data.attempt._id;

      // Second attempt start (simulating page reload)
      const secondRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(secondRes.body.data.isResumed).toBe(true);
      expect(secondRes.body.data.attempt._id).toBe(firstAttemptId);
    });

    it('should reject starting an attempt for a course the student is not enrolled in', async () => {
      const res = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/enrolled/i);
    });
  });

  describe('3. Answer Auto-Saving', () => {
    it('should save selected answers during in-progress attempt', async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const attemptId = startRes.body.data.attempt._id;

      const saveRes = await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionId: singleChoiceQ._id,
          selectedAnswers: ['b'],
        })
        .expect(200);

      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.data.saved).toBe(true);
      expect(saveRes.body.data.answeredQuestions).toBe(1);
    });

    it('should prevent unauthorized student from modifying another student attempt', async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const attemptId = startRes.body.data.attempt._id;

      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          questionId: singleChoiceQ._id,
          selectedAnswers: ['b'],
        })
        .expect(403);
    });
  });

  describe('4. Submission, Scoring & Exact Match Evaluation', () => {
    it('should evaluate Single Choice, Exact Multiple Choice, and True/False with PASS result', async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const attemptId = startRes.body.data.attempt._id;

      // Question 1: Single Choice (Correct: 'b') -> Answer 'b'
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: singleChoiceQ._id, selectedAnswers: ['b'] });

      // Question 2: Multiple Choice Exact Match (Correct: ['a', 'b']) -> Answer ['a', 'b']
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: multipleChoiceQ._id, selectedAnswers: ['a', 'b'] });

      // Question 3: True/False (Correct: 'true') -> Answer 'true'
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: trueFalseQ._id, selectedAnswers: ['true'] });

      // Submit
      const submitRes = await request(app)
        .post(`/api/v1/assessments/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(submitRes.body.success).toBe(true);
      const resData = submitRes.body.data.result;
      expect(resData.score).toBe(3);
      expect(resData.totalMarks).toBe(3);
      expect(resData.percentage).toBe(100);
      expect(resData.passed).toBe(true);
      expect(resData.correctAnswers).toBe(3);
      expect(resData.incorrectAnswers).toBe(0);
    });

    it('should award 0 marks when Multiple Choice answer is partial or contains extra options', async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const attemptId = startRes.body.data.attempt._id;

      // Question 1: Correct (1 mark)
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: singleChoiceQ._id, selectedAnswers: ['b'] });

      // Question 2: Partial selection (Only 'a' instead of ['a', 'b']) -> 0 marks
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: multipleChoiceQ._id, selectedAnswers: ['a'] });

      // Question 3: Incorrect selection ('false' instead of 'true') -> 0 marks
      await request(app)
        .patch(`/api/v1/assessments/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: trueFalseQ._id, selectedAnswers: ['false'] });

      const submitRes = await request(app)
        .post(`/api/v1/assessments/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const resData = submitRes.body.data.result;
      expect(resData.score).toBe(1);
      expect(resData.percentage).toBe(33);
      expect(resData.passed).toBe(false); // 33% < 70% passingScore
      expect(resData.correctAnswers).toBe(1);
      expect(resData.incorrectAnswers).toBe(2);
    });

    it('should be idempotent on repeated submission requests', async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      const attemptId = startRes.body.data.attempt._id;

      const firstSubmit = await request(app)
        .post(`/api/v1/assessments/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const secondSubmit = await request(app)
        .post(`/api/v1/assessments/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(firstSubmit.body.data.result.score).toBe(secondSubmit.body.data.result.score);
    });
  });

  describe('5. Result Privacy, Review & Attempt Limits', () => {
    let completedAttemptId;

    beforeEach(async () => {
      const startRes = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      completedAttemptId = startRes.body.data.attempt._id;

      await request(app)
        .post(`/api/v1/assessments/attempts/${completedAttemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('should allow attempt owner to view result and review with explanations', async () => {
      const resultRes = await request(app)
        .get(`/api/v1/assessments/attempts/${completedAttemptId}/result`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(resultRes.body.success).toBe(true);
      expect(resultRes.body.data.score).toBeDefined();

      const reviewRes = await request(app)
        .get(`/api/v1/assessments/attempts/${completedAttemptId}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.questions.length).toBe(3);
      expect(reviewRes.body.data.questions[0].explanation).toBeDefined();
      expect(reviewRes.body.data.questions[0].correctAnswers).toBeDefined();
    });

    it('should block non-owners from accessing attempt result or review (IDOR Protection)', async () => {
      await request(app)
        .get(`/api/v1/assessments/attempts/${completedAttemptId}/result`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);

      await request(app)
        .get(`/api/v1/assessments/attempts/${completedAttemptId}/review`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);
    });

    it('should enforce maxAttempts limit', async () => {
      // First attempt is already submitted above (attempt 1 of 2)
      // Start second attempt
      const attempt2 = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      // Submit second attempt
      await request(app)
        .post(`/api/v1/assessments/attempts/${attempt2.body.data.attempt._id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Try to start third attempt when maxAttempts is 2
      const attempt3 = await request(app)
        .post(`/api/v1/assessments/${publishedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(attempt3.body.message).toMatch(/maximum attempts/i);
    });

    it('should return chronological student assessment history', async () => {
      const res = await request(app)
        .get('/api/v1/assessments/history')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0].assessmentId).toBeDefined();
    });
  });
});
