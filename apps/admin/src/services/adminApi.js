const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('apex_admin_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('apex_admin_token');
    localStorage.removeItem('apex_admin_user');
    window.location.href = '/login?expired=1';
    throw new Error('Your administrative session has expired. Please sign in again.');
  }

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    error.errorCode = data.errorCode;
    throw error;
  }

  return data;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const adminApi = {
  // System Health & KPIs
  getOverview: () => request('/admin/overview'),
  getSystemHealth: () => request('/admin/system/health'),

  // Analytics & Monitoring
  getAnalyticsOverview: () => request('/admin/analytics/overview'),
  getUserAnalytics: () => request('/admin/analytics/users'),
  getCourseAnalytics: () => request('/admin/analytics/courses'),
  getLearningAnalytics: () => request('/admin/analytics/learning'),
  getAiMonitoring: () => request('/admin/analytics/ai'),

  // Phase 11: Learning Health & Intelligence
  getLearningHealth: () => request('/admin/analytics/learning-health'),
  getRecommendationAnalytics: () => request('/admin/analytics/recommendations'),
  getEngagementAnalytics: () => request('/admin/analytics/engagement'),

  // User Management
  getUsers: (params) => request(`/admin/users${buildQuery(params)}`),
  getUserById: (id) => request(`/admin/users/${id}`),
  updateUserStatus: (id, data) =>
    request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Student Management
  getStudents: (params) => request(`/admin/students${buildQuery(params)}`),
  getStudentDetail: (id) => request(`/admin/students/${id}`),

  // Instructor Management
  getInstructors: (params) => request(`/admin/instructors${buildQuery(params)}`),
  getInstructorDetail: (id) => request(`/admin/instructors/${id}`),
  approveInstructor: (id) =>
    request(`/admin/instructors/${id}/approve`, { method: 'POST' }),
  rejectInstructor: (id, data) =>
    request(`/admin/instructors/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  suspendInstructor: (id, data) =>
    request(`/admin/instructors/${id}/suspend`, { method: 'POST', body: JSON.stringify(data) }),
  activateInstructor: (id) =>
    request(`/admin/instructors/${id}/activate`, { method: 'POST' }),

  // Course Management
  getCourses: (params) => request(`/admin/courses${buildQuery(params)}`),
  getPendingCourses: (params) => request(`/admin/courses/pending${buildQuery(params)}`),
  getCourseReview: (id) => request(`/admin/courses/${id}/review`),
  approveCourse: (id) => request(`/admin/courses/${id}/approve`, { method: 'POST' }),
  rejectCourse: (id, data) =>
    request(`/admin/courses/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  publishCourse: (id) => request(`/admin/courses/${id}/publish`, { method: 'POST' }),
  unpublishCourse: (id, data) =>
    request(`/admin/courses/${id}/unpublish`, { method: 'POST', body: JSON.stringify(data) }),
  archiveCourse: (id) => request(`/admin/courses/${id}/archive`, { method: 'POST' }),
  flagCourse: (id, data) =>
    request(`/admin/courses/${id}/flag`, { method: 'POST', body: JSON.stringify(data) }),

  // Assessments & Coding
  getAssessments: (params) => request(`/admin/assessments${buildQuery(params)}`),
  getCodingProblems: (params) => request(`/admin/coding-problems${buildQuery(params)}`),

  // Categories
  getCategories: () => request('/admin/categories'),
  createCategory: (data) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  archiveCategory: (id) =>
    request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (params) => request(`/admin/reports${buildQuery(params)}`),
  getReportById: (id) => request(`/admin/reports/${id}`),
  updateReport: (id, data) =>
    request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params) => request(`/admin/audit-logs${buildQuery(params)}`),
  exportAuditLogsUrl: (format = 'csv') => `${API_BASE_URL}/admin/audit-logs/export?format=${format}`,

  // Announcements
  getAnnouncements: (params) => request(`/admin/announcements${buildQuery(params)}`),
  createAnnouncement: (data) =>
    request('/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // Settings & Feature Flags
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) =>
    request('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getFeatureFlags: () => request('/admin/feature-flags'),
  updateFeatureFlag: (key, data) =>
    request(`/admin/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Admin Management (Super Admin only)
  getAdmins: () => request('/admin/admins'),
  createAdmin: (data) =>
    request('/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminPermissions: (id, data) =>
    request(`/admin/admins/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  disableAdmin: (id) =>
    request(`/admin/admins/${id}/disable`, { method: 'POST' }),
};
