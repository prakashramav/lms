const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const originalFetch = typeof globalThis !== 'undefined' && globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch;

function authFetch(url, init = {}) {
  return originalFetch(url, {
    ...init,
    credentials: 'include',
  });
}

const handleResponse = async (res) => {
  if (res.status === 401) {
    const err = new Error('SESSION_EXPIRED');
    err.status = 401;
    throw err;
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data;
};

export async function fetchLearningProfile(token) {
  const res = await authFetch(`${API_BASE_URL}/student/learning-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchSkills(token) {
  const res = await authFetch(`${API_BASE_URL}/student/skills`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchWeakTopics(token) {
  const res = await authFetch(`${API_BASE_URL}/student/weak-topics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchRecommendations(token) {
  const res = await authFetch(`${API_BASE_URL}/student/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function submitRecommendationFeedback(token, id, rating, comment = '') {
  const res = await authFetch(`${API_BASE_URL}/student/recommendations/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, comment }),
  });
  return handleResponse(res);
}

export async function dismissRecommendation(token, id) {
  const res = await authFetch(`${API_BASE_URL}/student/recommendations/${id}/dismiss`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchDailyPlan(token) {
  const res = await authFetch(`${API_BASE_URL}/student/daily-plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function generateDailyPlan(token, options = {}) {
  const res = await authFetch(`${API_BASE_URL}/student/daily-plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(options),
  });
  return handleResponse(res);
}

export async function toggleDailyTask(token, taskId, isCompleted) {
  const res = await authFetch(`${API_BASE_URL}/student/daily-plan/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isCompleted }),
  });
  return handleResponse(res);
}

export async function fetchGoals(token) {
  const res = await authFetch(`${API_BASE_URL}/student/goals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createGoal(token, goalData) {
  const res = await authFetch(`${API_BASE_URL}/student/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(goalData),
  });
  return handleResponse(res);
}

export async function updateGoal(token, goalId, goalData) {
  const res = await authFetch(`${API_BASE_URL}/student/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(goalData),
  });
  return handleResponse(res);
}

export async function deleteGoal(token, goalId) {
  const res = await authFetch(`${API_BASE_URL}/student/goals/${goalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchRevisionQueue(token) {
  const res = await authFetch(`${API_BASE_URL}/student/revision`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function completeRevisionTopic(token, topicId, performance = 'GOOD') {
  const res = await authFetch(`${API_BASE_URL}/student/revision/${topicId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ performance }),
  });
  return handleResponse(res);
}

export async function fetchMistakes(token, query = {}) {
  const params = new URLSearchParams(query).toString();
  const res = await authFetch(`${API_BASE_URL}/student/mistakes${params ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchMistakeById(token, mistakeId) {
  const res = await authFetch(`${API_BASE_URL}/student/mistakes/${mistakeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function retryMistake(token, mistakeId) {
  const res = await authFetch(`${API_BASE_URL}/student/mistakes/${mistakeId}/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchAchievements(token) {
  const res = await authFetch(`${API_BASE_URL}/student/achievements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchWeeklyReview(token) {
  const res = await authFetch(`${API_BASE_URL}/student/weekly-review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchLearningSettings(token) {
  const res = await authFetch(`${API_BASE_URL}/student/settings/learning`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateLearningSettings(token, settings) {
  const res = await authFetch(`${API_BASE_URL}/student/settings/learning`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
}

// ====================================================
// PHASE 16: LEARNING INTELLIGENCE & ECOSYSTEM SERVICES
// ====================================================

export async function fetchKnowledgeProfile(token) {
  const res = await authFetch(`${API_BASE_URL}/learning-intelligence/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchPrerequisiteGaps(token, skillSlug) {
  const res = await authFetch(`${API_BASE_URL}/learning-intelligence/dependencies/${skillSlug}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchPersonalizedRoadmap(token) {
  const res = await authFetch(`${API_BASE_URL}/learning-intelligence/roadmap`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchDailyLearningPlan(token, minutes = 60) {
  const res = await authFetch(`${API_BASE_URL}/learning-intelligence/daily-plan?minutes=${minutes}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function startAdaptiveDiagnostic(token, track = 'FULLSTACK') {
  const res = await authFetch(`${API_BASE_URL}/diagnostic/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ track }),
  });
  return handleResponse(res);
}

export async function submitAdaptiveDiagnosticAnswer(token, { attemptId, questionId, selectedAnswer }) {
  const res = await authFetch(`${API_BASE_URL}/diagnostic/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ attemptId, questionId, selectedAnswer }),
  });
  return handleResponse(res);
}

export async function fetchSpacedReviewsDue(token) {
  const res = await authFetch(`${API_BASE_URL}/spaced-review/due`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function recordSpacedReviewAttempt(token, { reviewId, wasSuccessful, recallScore }) {
  const res = await authFetch(`${API_BASE_URL}/spaced-review/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reviewId, wasSuccessful, recallScore }),
  });
  return handleResponse(res);
}

export async function fetchCategorizedMistakes(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE_URL}/spaced-review/mistakes?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function resolveStudentMistake(token, mistakeId) {
  const res = await authFetch(`${API_BASE_URL}/spaced-review/mistakes/${mistakeId}/resolve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function requestSocraticTutor(token, { concept, studentQuestion, currentContext }) {
  const res = await authFetch(`${API_BASE_URL}/ai/tutor/socratic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ concept, studentQuestion, currentContext }),
  });
  return handleResponse(res);
}

export async function submitTeachBack(token, { concept, studentExplanation, targetLevel }) {
  const res = await authFetch(`${API_BASE_URL}/ai/tutor/teach-back`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ concept, studentExplanation, targetLevel }),
  });
  return handleResponse(res);
}

export async function requestProgressiveHint(token, { problemTitle, problemDescription, hintTier, studentCode }) {
  const res = await authFetch(`${API_BASE_URL}/ai/tutor/progressive-hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ problemTitle, problemDescription, hintTier, studentCode }),
  });
  return handleResponse(res);
}

