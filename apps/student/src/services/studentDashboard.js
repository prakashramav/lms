const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Fetches dashboard telemetry for authenticated student
 * @param {string} accessToken
 * @returns {Promise<object>} Dashboard payload
 */
export async function fetchStudentDashboard(accessToken) {
  if (!accessToken) {
    const err = new Error('Authentication required to load dashboard');
    err.status = 401;
    throw err;
  }

  const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    const err = new Error('SESSION_EXPIRED');
    err.status = 401;
    throw err;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Unable to load your dashboard.');
  }

  return data.data;
}
