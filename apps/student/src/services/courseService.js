const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Helper to build auth headers
 */
function getAuthHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Fetch course catalog with search, filter, sort, pagination
 */
export async function fetchCourses({ page = 1, limit = 12, search = '', category = '', difficulty = '', sort = 'newest' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (search) params.set('search', search);
  if (category && category !== 'all') params.set('category', category);
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
  if (sort) params.set('sort', sort);

  const res = await fetch(`${API_BASE_URL}/courses?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch courses');
  }
  return json.data;
}

/**
 * Fetch course details by slug (includes curriculum structure)
 */
export async function fetchCourseBySlug(slug, accessToken) {
  const res = await fetch(`${API_BASE_URL}/courses/${slug}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch course details');
  }
  return json.data;
}

/**
 * Fetch complete curriculum modules & lessons for a course
 */
export async function fetchCourseCurriculum(courseId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/curriculum`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch course curriculum');
  }
  return json.data;
}

/**
 * Enroll student in a course
 */
export async function enrollInCourse(courseId, accessToken) {
  if (!accessToken) {
    throw new Error('Please sign in to enroll in this course');
  }

  const res = await fetch(`${API_BASE_URL}/enrollments`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ courseId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to enroll in course');
  }
  return json.data;
}

/**
 * Fetch user's enrollments
 */
export async function fetchEnrollments(accessToken) {
  if (!accessToken) return [];

  const res = await fetch(`${API_BASE_URL}/enrollments`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch enrollments');
  }
  return json.data;
}

/**
 * Fetch specific enrollment for a course
 */
export async function fetchEnrollmentByCourse(courseId, accessToken) {
  if (!accessToken) return null;

  const res = await fetch(`${API_BASE_URL}/enrollments/${courseId}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
  });

  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to check enrollment');
  }
  return json.data;
}

/**
 * Fetch student progress for a course
 */
export async function fetchCourseProgress(courseId, accessToken) {
  if (!accessToken) return null;

  const res = await fetch(`${API_BASE_URL}/progress/${courseId}`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch course progress');
  }
  return json.data;
}

/**
 * Start a lesson
 */
export async function startLessonProgress(lessonId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/progress/lessons/${lessonId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to start lesson');
  }
  return json.data;
}

/**
 * Update lesson position / time spent
 */
export async function updateLessonProgress(lessonId, { lastPosition, timeSpent }, accessToken) {
  const res = await fetch(`${API_BASE_URL}/progress/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ lastPosition, timeSpent }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to save progress');
  }
  return json.data;
}

/**
 * Mark lesson complete
 */
export async function completeLessonProgress(lessonId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/progress/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to mark lesson complete');
  }
  return json.data;
}

/**
 * Fetch bookmarks for student
 */
export async function fetchBookmarks(accessToken) {
  if (!accessToken) return [];

  const res = await fetch(`${API_BASE_URL}/bookmarks`, {
    method: 'GET',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch bookmarks');
  }
  return json.data;
}

/**
 * Toggle bookmark for a lesson
 */
export async function toggleBookmark(lessonId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/bookmarks/${lessonId}`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to toggle bookmark');
  }
  return json.data;
}

/**
 * Delete bookmark
 */
export async function removeBookmark(lessonId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/bookmarks/${lessonId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to remove bookmark');
  }
  return json.data;
}
