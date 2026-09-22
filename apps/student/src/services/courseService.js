const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Unified API fetch wrapper sending 7-day HTTP-only cookies
 */
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Portal': 'student',
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    const redirectParam = currentPath && currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
    window.location.href = `/login${redirectParam}`;
    const error = new Error('Session expired');
    error.status = 401;
    throw error;
  }

  return res;
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

  const res = await apiFetch(`/courses?${params.toString()}`, {
    method: 'GET',
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
export async function fetchCourseBySlug(slug) {
  const res = await apiFetch(`/courses/${slug}`, {
    method: 'GET',
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
export async function fetchCourseCurriculum(courseId) {
  const res = await apiFetch(`/courses/${courseId}/curriculum`, {
    method: 'GET',
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
export async function enrollInCourse(courseId) {
  const res = await apiFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to enroll in course');
  }
  return json.data?.enrollment !== undefined ? json.data.enrollment : json.data;
}

/**
 * Fetch user's enrollments
 */
export async function fetchEnrollments() {
  const res = await apiFetch('/enrollments', {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch enrollments');
  }
  return json.data?.enrollments || (Array.isArray(json.data) ? json.data : []);
}

/**
 * Fetch specific enrollment for a course
 */
export async function fetchEnrollmentByCourse(courseId) {
  const res = await apiFetch(`/enrollments/${courseId}`, {
    method: 'GET',
  });

  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to check enrollment');
  }
  return json.data?.enrollment !== undefined ? json.data.enrollment : json.data;
}

/**
 * Fetch student progress for a course
 */
export async function fetchCourseProgress(courseId) {
  const res = await apiFetch(`/progress/${courseId}`, {
    method: 'GET',
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
export async function startLessonProgress(lessonId) {
  const res = await apiFetch(`/progress/lessons/${lessonId}/start`, {
    method: 'POST',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to start lesson');
  }
  return json.data?.progress !== undefined ? json.data.progress : json.data;
}

/**
 * Update lesson position / time spent
 */
export async function updateLessonProgress(lessonId, { lastPosition, timeSpent }) {
  const res = await apiFetch(`/progress/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify({ lastPosition, timeSpent }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to save progress');
  }
  return json.data?.progress !== undefined ? json.data.progress : json.data;
}

/**
 * Mark lesson complete
 */
export async function completeLessonProgress(lessonId) {
  const res = await apiFetch(`/progress/lessons/${lessonId}/complete`, {
    method: 'POST',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to mark lesson complete');
  }
  return json.data?.progress !== undefined ? json.data.progress : json.data;
}

/**
 * Fetch bookmarks for student
 */
export async function fetchBookmarks() {
  const res = await apiFetch('/bookmarks', {
    method: 'GET',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch bookmarks');
  }
  return json.data?.bookmarks || (Array.isArray(json.data) ? json.data : []);
}

/**
 * Toggle bookmark for a lesson
 */
export async function toggleBookmark(lessonId) {
  const res = await apiFetch(`/bookmarks/${lessonId}`, {
    method: 'POST',
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
export async function removeBookmark(lessonId) {
  const res = await apiFetch(`/bookmarks/${lessonId}`, {
    method: 'DELETE',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to remove bookmark');
  }
  return json.data;
}
