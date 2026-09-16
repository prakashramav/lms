const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function fetchWithAuth(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = res.status;
    error.code = data.errorCode;
    throw error;
  }

  return data;
}

export const practiceService = {
  // Get supported languages
  async getLanguages() {
    return fetchWithAuth('/practice/languages');
  },

  // Problem Catalog
  async getProblems(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth(`/practice/problems${qs}`);
  },

  // Problem Details
  async getProblemBySlug(slug) {
    return fetchWithAuth(`/practice/problems/${slug}`);
  },

  // Code Execution
  async runCode(problemId, { language, code, customInput }) {
    return fetchWithAuth(`/practice/problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ language, code, customInput }),
    });
  },

  // Submit Code
  async submitCode(problemId, { language, code }) {
    return fetchWithAuth(`/practice/problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    });
  },

  // Draft Autosave
  async saveDraft(problemId, language, code) {
    return fetchWithAuth(`/practice/drafts/${problemId}`, {
      method: 'PUT',
      body: JSON.stringify({ language, code }),
    });
  },

  async getDraft(problemId, language) {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return fetchWithAuth(`/practice/drafts/${problemId}${qs}`);
  },

  // Bookmarks
  async toggleBookmark(problemId) {
    return fetchWithAuth(`/practice/problems/${problemId}/bookmark`, {
      method: 'POST',
    });
  },

  async getBookmarks() {
    return fetchWithAuth('/practice/bookmarks');
  },

  // Submissions
  async getSubmissions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth(`/practice/submissions${qs}`);
  },

  async getSubmissionDetail(submissionId) {
    return fetchWithAuth(`/practice/submissions/${submissionId}`);
  },

  // Student Practice Statistics
  async getPracticeProgress() {
    return fetchWithAuth('/practice/progress');
  },
};
