const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
  const res = await fetch(`${API_BASE_URL}/student/learning-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchSkills(token) {
  const res = await fetch(`${API_BASE_URL}/student/skills`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchWeakTopics(token) {
  const res = await fetch(`${API_BASE_URL}/student/weak-topics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchRecommendations(token) {
  const res = await fetch(`${API_BASE_URL}/student/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function submitRecommendationFeedback(token, id, rating, comment = '') {
  const res = await fetch(`${API_BASE_URL}/student/recommendations/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, comment }),
  });
  return handleResponse(res);
}

export async function dismissRecommendation(token, id) {
  const res = await fetch(`${API_BASE_URL}/student/recommendations/${id}/dismiss`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchDailyPlan(token) {
  const res = await fetch(`${API_BASE_URL}/student/daily-plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function generateDailyPlan(token, options = {}) {
  const res = await fetch(`${API_BASE_URL}/student/daily-plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(options),
  });
  return handleResponse(res);
}

export async function toggleDailyTask(token, taskId, isCompleted) {
  const res = await fetch(`${API_BASE_URL}/student/daily-plan/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isCompleted }),
  });
  return handleResponse(res);
}

export async function fetchGoals(token) {
  const res = await fetch(`${API_BASE_URL}/student/goals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createGoal(token, goalData) {
  const res = await fetch(`${API_BASE_URL}/student/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(goalData),
  });
  return handleResponse(res);
}

export async function updateGoal(token, goalId, goalData) {
  const res = await fetch(`${API_BASE_URL}/student/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(goalData),
  });
  return handleResponse(res);
}

export async function deleteGoal(token, goalId) {
  const res = await fetch(`${API_BASE_URL}/student/goals/${goalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchRevisionQueue(token) {
  const res = await fetch(`${API_BASE_URL}/student/revision`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function completeRevisionTopic(token, topicId, performance = 'GOOD') {
  const res = await fetch(`${API_BASE_URL}/student/revision/${topicId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ performance }),
  });
  return handleResponse(res);
}

export async function fetchMistakes(token, query = {}) {
  const params = new URLSearchParams(query).toString();
  const res = await fetch(`${API_BASE_URL}/student/mistakes${params ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchMistakeById(token, mistakeId) {
  const res = await fetch(`${API_BASE_URL}/student/mistakes/${mistakeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function retryMistake(token, mistakeId) {
  const res = await fetch(`${API_BASE_URL}/student/mistakes/${mistakeId}/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchAchievements(token) {
  const res = await fetch(`${API_BASE_URL}/student/achievements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchWeeklyReview(token) {
  const res = await fetch(`${API_BASE_URL}/student/weekly-review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchLearningSettings(token) {
  const res = await fetch(`${API_BASE_URL}/student/settings/learning`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateLearningSettings(token, settings) {
  const res = await fetch(`${API_BASE_URL}/student/settings/learning`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
}
