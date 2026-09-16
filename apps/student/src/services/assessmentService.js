const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function getAuthHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Fetch assessments list with filtering & pagination
 */
export async function fetchAssessments(
  { courseId = '', moduleId = '', difficulty = 'all', type = 'all', search = '', page = 1, limit = 12 } = {},
  accessToken
) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (search) params.set('search', search);
  if (courseId) params.set('courseId', courseId);
  if (moduleId) params.set('moduleId', moduleId);
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
  if (type && type !== 'all') params.set('type', type);

  const res = await fetch(`${API_BASE_URL}/assessments?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch assessments');
  }
  return json.data;
}

/**
 * Fetch assessment details and student's attempt stats
 */
export async function fetchAssessmentById(assessmentId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch assessment details');
  }
  return json.data;
}

/**
 * Start or restore an assessment attempt
 */
export async function startAssessmentAttempt(assessmentId, accessToken) {
  if (!accessToken) {
    throw new Error('Authentication required to start assessment');
  }

  const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/attempts`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to start assessment attempt');
  }
  return json.data;
}

/**
 * Retrieve an active attempt
 */
export async function fetchAttempt(attemptId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/attempts/${attemptId}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to load attempt');
  }
  return json.data;
}

/**
 * Auto-save / patch answer during attempt
 */
export async function saveAttemptAnswer(attemptId, { questionId, selectedAnswers }, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ questionId, selectedAnswers }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to save answer');
  }
  return json.data;
}

/**
 * Submit assessment attempt
 */
export async function submitAssessmentAttempt(attemptId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to submit assessment');
  }
  return json.data;
}

/**
 * Fetch assessment attempt result summary
 */
export async function fetchAttemptResult(attemptId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/attempts/${attemptId}/result`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch result');
  }
  return json.data;
}

/**
 * Fetch assessment attempt review with explanations
 */
export async function fetchAttemptReview(attemptId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/assessments/attempts/${attemptId}/review`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch review');
  }
  return json.data;
}

/**
 * Fetch chronological student assessment history
 */
export async function fetchAssessmentHistory({ page = 1, limit = 10 } = {}, accessToken) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const res = await fetch(`${API_BASE_URL}/assessments/history?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch assessment history');
  }
  return json.data;
}
