const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Skill, StudentSkill } = require('../src/models/skill.model');
const SpacedReview = require('../src/models/spacedReview.model');
const Mistake = require('../src/models/mistake.model');
const DiagnosticAttempt = require('../src/models/diagnosticAttempt.model');
const { generateAccessToken } = require('../src/services/token.service');
const knowledgeProfileService = require('../src/services/intelligence/knowledgeProfile.service');
const skillDependencyService = require('../src/services/intelligence/skillDependency.service');
const diagnosticService = require('../src/services/intelligence/diagnosticAssessment.service');
const spacedReviewService = require('../src/services/intelligence/spacedReviewV2.service');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 16 - Learning Intelligence & Ecosystem Engine', () => {
  let studentUser;
  let studentToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await StudentSkill.deleteMany({});
    await SpacedReview.deleteMany({});
    await Mistake.deleteMany({});
    await DiagnosticAttempt.deleteMany({});

    studentUser = await User.create({
      name: 'Ecosystem Learner',
      email: 'learner@ecosystem.test',
      password: 'Password123!',
      role: 'STUDENT',
      isVerified: true,
    });

    studentToken = generateAccessToken(studentUser);
  });

  describe('1. Student Knowledge Profile & Evidence Graph', () => {
    it('should compute LOW confidence initially and upgrade to HIGH as multi-modal evidence accumulates', async () => {
      // 1. Initially empty profile
      const initialProfile = await knowledgeProfileService.getKnowledgeProfile(studentUser._id);
      expect(initialProfile.summary.totalSkills).toBe(0);

      // 2. Add self-reported evidence -> Confidence should be LOW
      await knowledgeProfileService.updateSelfReportedSkill(studentUser._id, 'react', 'INTERMEDIATE');
      let profile = await knowledgeProfileService.getKnowledgeProfile(studentUser._id);
      expect(profile.skills.length).toBe(1);
      expect(profile.skills[0].confidence).toBe('LOW');
      expect(profile.skills[0].selfReportedLevel).toBe('INTERMEDIATE');
      expect(profile.provenanceBreakdown.selfReported).toContain('React');

      // 3. Add observed assessment evidence -> Confidence upgrades to MEDIUM
      await knowledgeProfileService.recordSkillEvidence(studentUser._id, {
        skillSlug: 'react',
        evidenceType: 'ASSESSMENT',
        provenance: 'OBSERVED',
        score: 85,
        notes: 'Passed React component lifecycle quiz',
      });

      profile = await knowledgeProfileService.getKnowledgeProfile(studentUser._id);
      expect(profile.skills[0].observedScore).toBe(85);
      expect(profile.skills[0].confidence).toBe('MEDIUM');
      expect(profile.provenanceBreakdown.observed).toContain('React');

      // 4. Add verified project evidence -> Multi-modal bonus elevates confidence to HIGH
      await knowledgeProfileService.recordSkillEvidence(studentUser._id, {
        skillSlug: 'react',
        evidenceType: 'PROJECT',
        provenance: 'OBSERVED',
        score: 90,
        notes: 'Deployed full-stack portfolio in React',
      });

      profile = await knowledgeProfileService.getKnowledgeProfile(studentUser._id);
      expect(profile.skills[0].confidence).toBe('HIGH');
      expect(profile.skills[0].confidenceScore).toBeGreaterThanOrEqual(0.75);
      expect(profile.summary.highConfidenceSkills).toBe(1);
    });

    it('should retrieve structured knowledge profile via HTTP API', async () => {
      await knowledgeProfileService.recordSkillEvidence(studentUser._id, {
        skillSlug: 'javascript',
        evidenceType: 'CODE_PRACTICE',
        provenance: 'OBSERVED',
        score: 95,
      });

      const res = await request(app)
        .get('/api/v1/learning-intelligence/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills[0].slug).toBe('javascript');
      expect(res.body.data.skills[0].evidence.length).toBe(1);
    });
  });

  describe('2. Skill Dependency & Prerequisite Gap Engine', () => {
    it('should traverse prerequisite tree and identify missing foundations', async () => {
      // Student has no history for javascript-closures or javascript-scope
      const gaps = await skillDependencyService.analyzePrerequisiteGaps(
        studentUser._id,
        'react-hooks'
      );

      expect(gaps.targetSkill).toBe('react-hooks');
      expect(gaps.isRemediationRecommended).toBe(true);
      expect(gaps.gapsFoundCount).toBeGreaterThan(0);

      const closureGap = gaps.identifiedGaps.find((g) => g.skillSlug === 'javascript-closures');
      expect(closureGap).toBeDefined();
      expect(closureGap.recommendedAction).toContain('active recall');

      // Now student completes javascript-closures with high score
      await knowledgeProfileService.recordSkillEvidence(studentUser._id, {
        skillSlug: 'javascript-closures',
        evidenceType: 'ASSESSMENT',
        provenance: 'OBSERVED',
        score: 92,
      });

      const updatedGaps = await skillDependencyService.analyzePrerequisiteGaps(
        studentUser._id,
        'react-hooks'
      );

      const stillHasClosureGap = updatedGaps.identifiedGaps.some(
        (g) => g.skillSlug === 'javascript-closures'
      );
      expect(stillHasClosureGap).toBe(false);
    });

    it('should return prerequisite gap analysis via HTTP endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/learning-intelligence/dependencies/react')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prerequisiteTree.length).toBeGreaterThan(0);
    });
  });

  describe('3. Adaptive Diagnostic Assessment', () => {
    it('should initiate diagnostic and adapt question difficulty according to performance', async () => {
      // 1. Start diagnostic
      const startRes = await request(app)
        .post('/api/v1/diagnostic/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ track: 'FULLSTACK' });

      expect(startRes.status).toBe(201);
      expect(startRes.body.data.tier).toBe(1);
      const attemptId = startRes.body.data.attemptId;
      const q1Id = startRes.body.data.questionId;

      // 2. Answer question 1 correctly
      const answerRes1 = await request(app)
        .post('/api/v1/diagnostic/submit-answer')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          attemptId,
          questionId: q1Id,
          selectedAnswer: 'b', // correct for t1_js_functions or whichever is first
        });

      expect(answerRes1.status).toBe(200);
      expect(answerRes1.body.data.questionIndex).toBe(2);

      // Answer subsequent questions to reach completion
      let currentQId = answerRes1.body.data.questionId;
      let finalResult = answerRes1;

      while (finalResult.body.data.status === 'IN_PROGRESS') {
        finalResult = await request(app)
          .post('/api/v1/diagnostic/submit-answer')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            attemptId,
            questionId: currentQId,
            selectedAnswer: 'b',
          });
        currentQId = finalResult.body.data.questionId;
      }

      expect(finalResult.body.data.status).toBe('COMPLETED');
      expect(finalResult.body.data.report).toBeDefined();
      expect(Array.isArray(finalResult.body.data.report.recommendedCurriculum)).toBe(true);

      // Verify that completed diagnostic recorded evidence in student's Knowledge Profile
      const profile = await knowledgeProfileService.getKnowledgeProfile(studentUser._id);
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.summary.observedEvidenceCount).toBeGreaterThan(0);
    });
  });

  describe('4. Spaced Repetition & Mistake Bank Engine', () => {
    it('should advance spaced review intervals upon success and reset on failure', async () => {
      const review = await spacedReviewService.scheduleSpacedReview({
        studentId: studentUser._id,
        topic: 'JavaScript Closures',
        recallQuestion: 'What is a lexical closure?',
        recallAnswer: 'A function bundled with references to its surrounding state',
        intervalSequence: [1, 3, 7, 14, 30],
      });

      expect(review.intervalDays).toBe(1);
      expect(review.consecutiveSuccesses).toBe(0);

      // 1st successful recall -> advances from 1 to 3 days
      const attempt1 = await spacedReviewService.recordReviewAttempt(
        studentUser._id,
        review._id,
        { wasSuccessful: true }
      );
      expect(attempt1.intervalDays).toBe(3);
      expect(attempt1.consecutiveSuccesses).toBe(1);

      // 2nd successful recall -> advances from 3 to 7 days
      const attempt2 = await spacedReviewService.recordReviewAttempt(
        studentUser._id,
        review._id,
        { wasSuccessful: true }
      );
      expect(attempt2.intervalDays).toBe(7);
      expect(attempt2.consecutiveSuccesses).toBe(2);

      // Failure on next review -> resets back to 1 day
      const attempt3 = await spacedReviewService.recordReviewAttempt(
        studentUser._id,
        review._id,
        { wasSuccessful: false }
      );
      expect(attempt3.intervalDays).toBe(1);
      expect(attempt3.consecutiveSuccesses).toBe(0);
    });

    it('should categorize mistakes and cluster repeated error patterns', async () => {
      // Record 1st mistake in Async JS
      await spacedReviewService.recordMistake({
        studentId: studentUser._id,
        sourceType: 'ASSESSMENT',
        sourceId: studentUser._id,
        topic: 'Async JavaScript',
        promptSnippet: 'Promise rejection handling with async/await',
        mistakeType: 'CONCEPT',
        categoryEvidence: 'Misconception regarding unhandled promise rejection',
      });

      let mistakeBank = await spacedReviewService.getMistakeBank(studentUser._id);
      expect(mistakeBank.totalMistakes).toBe(1);
      expect(mistakeBank.repeatedPatterns.length).toBe(0);

      // Record 2nd mistake in same topic -> Triggers pattern detection & auto spaced review
      await spacedReviewService.recordMistake({
        studentId: studentUser._id,
        sourceType: 'CODING',
        sourceId: studentUser._id,
        topic: 'Async JavaScript',
        promptSnippet: 'Missing try/catch block around await',
        mistakeType: 'SYNTAX',
      });

      mistakeBank = await spacedReviewService.getMistakeBank(studentUser._id);
      expect(mistakeBank.totalMistakes).toBe(2);
      expect(mistakeBank.repeatedPatterns.length).toBe(1);
      expect(mistakeBank.repeatedPatterns[0].topic).toBe('Async JavaScript');
      expect(mistakeBank.repeatedPatterns[0].repetitionCount).toBe(2);

      // Spaced review should now have an item for Async JavaScript
      const dueReviews = await spacedReviewService.getDueReviews(studentUser._id, { includeUpcoming: true });
      expect(dueReviews.items.some((r) => r.topic === 'Async JavaScript')).toBe(true);
    });
  });
});
