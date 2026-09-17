const DiagnosticAttempt = require('../../models/diagnosticAttempt.model');
const { recordSkillEvidence } = require('./knowledgeProfile.service');
const { analyzePrerequisiteGaps } = require('./skillDependency.service');

// Curated pool of adaptive diagnostic items
const DIAGNOSTIC_QUESTION_BANK = [
  // TIER 1 - Foundations
  {
    id: 't1_js_functions',
    tier: 1,
    skillSlug: 'javascript-functions',
    skillName: 'JavaScript Functions',
    question: 'What is the return value of a JavaScript function that does not contain a return statement?',
    options: [
      { id: 'a', text: 'null' },
      { id: 'b', text: 'undefined' },
      { id: 'c', text: '0' },
      { id: 'd', text: 'false' },
    ],
    correctAnswer: 'b',
    explanation: 'In JavaScript, functions without an explicit return statement return undefined.',
  },
  {
    id: 't1_js_arrays',
    tier: 1,
    skillSlug: 'javascript',
    skillName: 'JavaScript Basics',
    question: 'Which array method creates a new array populated with the results of calling a provided function on every element?',
    options: [
      { id: 'a', text: 'filter()' },
      { id: 'b', text: 'forEach()' },
      { id: 'c', text: 'map()' },
      { id: 'd', text: 'reduce()' },
    ],
    correctAnswer: 'c',
    explanation: 'Array.prototype.map() transforms each element and returns a new array.',
  },
  {
    id: 't1_html_dom',
    tier: 1,
    skillSlug: 'html',
    skillName: 'HTML & DOM',
    question: 'Which HTML element is the recommended semantic container for navigation links?',
    options: [
      { id: 'a', text: '<div class="nav">' },
      { id: 'b', text: '<nav>' },
      { id: 'c', text: '<section>' },
      { id: 'd', text: '<menu>' },
    ],
    correctAnswer: 'b',
    explanation: 'The <nav> element represents a section of a page whose purpose is to provide navigation links.',
  },

  // TIER 2 - Intermediate
  {
    id: 't2_js_closures',
    tier: 2,
    skillSlug: 'javascript-closures',
    skillName: 'JavaScript Closures',
    question: 'What allows an inner function to retain access to variables declared in its outer enclosing scope even after the outer function has finished executing?',
    options: [
      { id: 'a', text: 'Hoisting' },
      { id: 'b', text: 'Lexical Closure' },
      { id: 'c', text: 'Event Delegation' },
      { id: 'd', text: 'Prototype Chaining' },
    ],
    correctAnswer: 'b',
    explanation: 'A closure is the combination of a function bundled together with references to its surrounding state (lexical environment).',
  },
  {
    id: 't2_react_hooks',
    tier: 2,
    skillSlug: 'react-hooks',
    skillName: 'React Hooks',
    question: 'When does the cleanup function in useEffect run?',
    options: [
      { id: 'a', text: 'Only when the application crashes' },
      { id: 'b', text: 'Before the component unmounts and before re-running the effect on dependency change' },
      { id: 'c', text: 'After the initial render only' },
      { id: 'd', text: 'Synchronously during JSX compilation' },
    ],
    correctAnswer: 'b',
    explanation: 'React runs effect cleanup before executing the new effect and when unmounting.',
  },
  {
    id: 't2_async_await',
    tier: 2,
    skillSlug: 'javascript',
    skillName: 'Asynchronous JavaScript',
    question: 'What does an async function in JavaScript always return?',
    options: [
      { id: 'a', text: 'A Promise' },
      { id: 'b', text: 'A Generator' },
      { id: 'c', text: 'A Callback' },
      { id: 'd', text: 'The raw value immediately' },
    ],
    correctAnswer: 'a',
    explanation: 'Async functions always wrap their return value in a Promise.',
  },

  // TIER 3 - Advanced
  {
    id: 't3_react_performance',
    tier: 3,
    skillSlug: 'react',
    skillName: 'React Architecture & Performance',
    question: 'What is the primary purpose of useMemo in React?',
    options: [
      { id: 'a', text: 'To persist values across full browser page reloads' },
      { id: 'b', text: 'To memoize the result of an expensive calculation between re-renders' },
      { id: 'c', text: 'To create a global singleton state across unrelated components' },
      { id: 'd', text: 'To trigger immediate DOM mutations bypassing the virtual DOM' },
    ],
    correctAnswer: 'b',
    explanation: 'useMemo caches the result of a calculation between re-renders when dependencies have not changed.',
  },
  {
    id: 't3_node_event_loop',
    tier: 3,
    skillSlug: 'node',
    skillName: 'Node.js Runtime & Event Loop',
    question: 'In Node.js, which queue handles process.nextTick() callbacks relative to the standard event loop phases?',
    options: [
      { id: 'a', text: 'Check phase (setImmediate)' },
      { id: 'b', text: 'Microtask queue, processed immediately before the event loop continues to the next phase' },
      { id: 'c', text: 'Timers phase (setTimeout)' },
      { id: 'd', text: 'Poll phase after I/O execution' },
    ],
    correctAnswer: 'b',
    explanation: 'process.nextTick callbacks are resolved after the current operation finishes, before moving to the next event loop phase.',
  },
];

/**
 * Start a new diagnostic assessment
 */
async function startDiagnostic(studentId, track = 'FULLSTACK') {
  // Cancel any existing in-progress attempts
  await DiagnosticAttempt.updateMany(
    { studentId, status: 'IN_PROGRESS' },
    { status: 'ABANDONED' }
  );

  const attempt = await DiagnosticAttempt.create({
    studentId,
    track,
    status: 'IN_PROGRESS',
    currentTier: 1,
    currentQuestionIndex: 0,
    responses: [],
  });

  // Pick first Tier 1 question
  const initialQuestion = DIAGNOSTIC_QUESTION_BANK.find((q) => q.tier === 1);

  return {
    attemptId: attempt._id,
    questionIndex: 1,
    totalQuestions: 5,
    tier: initialQuestion.tier,
    skillName: initialQuestion.skillName,
    questionId: initialQuestion.id,
    question: initialQuestion.question,
    options: initialQuestion.options,
  };
}

/**
 * Submit answer, adapt next question, or finalize report
 */
async function submitDiagnosticAnswer(studentId, attemptId, questionId, selectedAnswer) {
  const attempt = await DiagnosticAttempt.findOne({
    _id: attemptId,
    studentId,
    status: 'IN_PROGRESS',
  });

  if (!attempt) {
    throw new Error('Active diagnostic attempt not found');
  }

  const currentQ = DIAGNOSTIC_QUESTION_BANK.find((q) => q.id === questionId);
  if (!currentQ) {
    throw new Error('Question reference invalid');
  }

  const isCorrect = String(selectedAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

  // Save response
  attempt.responses.push({
    questionText: currentQ.question,
    skillSlug: currentQ.skillSlug,
    tier: currentQ.tier,
    selectedAnswer,
    isCorrect,
    answeredAt: new Date(),
  });

  attempt.currentQuestionIndex = attempt.responses.length;

  // Check if diagnostic session should conclude (5 questions target)
  const MAX_QUESTIONS = 5;
  if (attempt.responses.length >= MAX_QUESTIONS) {
    return await finalizeDiagnostic(attempt);
  }

  // Adaptive logic for next question:
  // If correct -> consider increasing tier
  // If incorrect -> reduce tier or stay in foundation
  const recentResponses = attempt.responses.slice(-2);
  const consecutiveCorrect = recentResponses.filter((r) => r.isCorrect).length;

  let nextTier = attempt.currentTier;
  if (isCorrect && consecutiveCorrect >= 2 && attempt.currentTier < 3) {
    nextTier = attempt.currentTier + 1;
  } else if (!isCorrect && attempt.currentTier > 1) {
    nextTier = attempt.currentTier - 1;
  }
  attempt.currentTier = nextTier;

  // Filter questions not already answered
  const answeredIds = new Set(attempt.responses.map((r) => {
    // Map back using question text
    const found = DIAGNOSTIC_QUESTION_BANK.find((q) => q.question === r.questionText);
    return found ? found.id : null;
  }));

  let candidates = DIAGNOSTIC_QUESTION_BANK.filter(
    (q) => q.tier === nextTier && !answeredIds.has(q.id)
  );

  if (candidates.length === 0) {
    // Fallback to any unanswered question
    candidates = DIAGNOSTIC_QUESTION_BANK.filter((q) => !answeredIds.has(q.id));
  }

  if (candidates.length === 0) {
    // If bank exhausted, finalize early
    return await finalizeDiagnostic(attempt);
  }

  const nextQuestion = candidates[0];
  await attempt.save();

  return {
    status: 'IN_PROGRESS',
    attemptId: attempt._id,
    questionIndex: attempt.currentQuestionIndex + 1,
    totalQuestions: MAX_QUESTIONS,
    tier: nextQuestion.tier,
    skillName: nextQuestion.skillName,
    questionId: nextQuestion.id,
    question: nextQuestion.question,
    options: nextQuestion.options,
    lastAnswerCorrect: isCorrect,
    explanation: currentQ.explanation,
  };
}

/**
 * Finalize diagnostic assessment, record evidence, and compile diagnostic report
 */
async function finalizeDiagnostic(attempt) {
  const responses = attempt.responses;
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const masteryPercentage = Math.round((correctCount / responses.length) * 100);

  const strongSkills = [];
  const developingSkills = [];
  const knowledgeGaps = [];

  const skillPerformance = {};
  for (const r of responses) {
    if (!skillPerformance[r.skillSlug]) {
      skillPerformance[r.skillSlug] = { correct: 0, total: 0, highestTier: r.tier };
    }
    skillPerformance[r.skillSlug].total++;
    if (r.isCorrect) {
      skillPerformance[r.skillSlug].correct++;
      if (r.tier > skillPerformance[r.skillSlug].highestTier) {
        skillPerformance[r.skillSlug].highestTier = r.tier;
      }
    }
  }

  // Record observed evidence into Student Knowledge Profile
  for (const [slug, perf] of Object.entries(skillPerformance)) {
    const score = Math.round((perf.correct / perf.total) * 100);
    if (perf.correct === perf.total && perf.highestTier >= 2) {
      strongSkills.push(slug);
    } else if (perf.correct > 0) {
      developingSkills.push(slug);
    } else {
      knowledgeGaps.push(slug);
    }

    // Update Knowledge Profile with observed assessment evidence
    await recordSkillEvidence(attempt.studentId, {
      skillSlug: slug,
      evidenceType: 'ASSESSMENT',
      provenance: 'OBSERVED',
      score,
      referenceId: attempt._id,
      notes: `Diagnostic assessment score: ${score}% at tier ${perf.highestTier}`,
    });
  }

  // Check for prerequisite gaps on any knowledge gaps
  const prerequisiteGaps = [];
  for (const gapSlug of knowledgeGaps) {
    const prereqAnalysis = await analyzePrerequisiteGaps(attempt.studentId, gapSlug);
    if (prereqAnalysis.identifiedGaps.length > 0) {
      for (const gap of prereqAnalysis.identifiedGaps) {
        prerequisiteGaps.push({
          skill: gapSlug,
          missingPrerequisite: gap.skillSlug,
          recommendation: gap.recommendedAction,
        });
      }
    }
  }

  // Build recommended curriculum
  const recommendedCurriculum = [];
  for (const gap of knowledgeGaps) {
    recommendedCurriculum.push({
      type: 'LESSON',
      title: `Mastering ${gap.replace('-', ' ').toUpperCase()}`,
      reason: `Identified gap during diagnostic assessment`,
      skill: gap,
      url: `/courses?skill=${gap}`,
    });
    recommendedCurriculum.push({
      type: 'PRACTICE',
      title: `${gap.replace('-', ' ')} Targeted Code Drills`,
      reason: `Hands-on active repetition to reinforce weak concepts`,
      skill: gap,
      url: `/practice?skill=${gap}`,
    });
  }

  if (knowledgeGaps.length === 0 && strongSkills.length > 0) {
    recommendedCurriculum.push({
      type: 'PROJECT',
      title: `Full-Stack Portfolio Showcase`,
      reason: `Demonstrated strong foundations; ready for portfolio-grade development`,
      skill: strongSkills[0],
      url: `/projects/showcase`,
    });
  }

  attempt.status = 'COMPLETED';
  attempt.completedAt = new Date();
  attempt.report = {
    strongSkills,
    developingSkills,
    knowledgeGaps,
    prerequisiteGaps,
    overallMasteryPercentage: masteryPercentage,
    recommendedCurriculum,
  };

  await attempt.save();

  return {
    status: 'COMPLETED',
    attemptId: attempt._id,
    report: attempt.report,
  };
}

/**
 * Retrieve completed diagnostic report
 */
async function getDiagnosticReport(studentId, attemptId) {
  const attempt = await DiagnosticAttempt.findOne({
    _id: attemptId,
    studentId,
  }).lean();

  if (!attempt) {
    throw new Error('Diagnostic report not found');
  }

  return attempt;
}

module.exports = {
  startDiagnostic,
  submitDiagnosticAnswer,
  getDiagnosticReport,
  DIAGNOSTIC_QUESTION_BANK,
};
