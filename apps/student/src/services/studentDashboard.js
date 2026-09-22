const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Fetches dashboard telemetry for authenticated student
 * @param {string} accessToken
 * @returns {Promise<object>} Dashboard payload
 */
export async function fetchStudentDashboard(accessToken) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Portal': 'student',
  };
  if (accessToken && accessToken !== 'cookie-session') {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const err = new Error('SESSION_EXPIRED');
    err.status = 401;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error('FORBIDDEN_ROLE');
    err.status = 403;
    throw err;
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Unable to load your dashboard.');
    err.status = res.status;
    throw err;
  }

  return data.data;
}
