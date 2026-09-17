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
  return data.data !== undefined ? data.data : data;
};

// ================= CAREER PATHS & READINESS =================
export async function fetchCareerPaths(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/career/paths`, { headers });
  return handleResponse(res);
}

export async function fetchCareerPathBySlug(slug, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/career/paths/${slug}`, { headers });
  return handleResponse(res);
}

export async function fetchCareerRoadmap(careerPathId, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/career/roadmap/${careerPathId}`, { headers });
  return handleResponse(res);
}

export async function fetchCareerProfile(token) {
  const res = await fetch(`${API_BASE_URL}/student/career-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateTargetCareer(token, careerPathId) {
  const res = await fetch(`${API_BASE_URL}/student/career-profile/target`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ careerPathId }),
  });
  return handleResponse(res);
}

export async function fetchSkillGaps(token, careerPathId = null) {
  const url = careerPathId
    ? `${API_BASE_URL}/student/skill-gaps?careerPathId=${careerPathId}`
    : `${API_BASE_URL}/student/skill-gaps`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchCareerPlan(token) {
  const res = await fetch(`${API_BASE_URL}/student/career-plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function toggleCareerMilestone(token, milestoneIndex, completed) {
  const res = await fetch(`${API_BASE_URL}/student/career-plan/milestones/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ milestoneIndex, completed }),
  });
  return handleResponse(res);
}

export async function fetchStudentCareerAnalytics(token) {
  const res = await fetch(`${API_BASE_URL}/student/career-analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ================= JOB BOARD & SAVED JOBS =================
export async function searchJobs(token = null, queryParams = {}) {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to search jobs');
  return data;
}

export async function fetchJobDetails(jobId, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { headers });
  return handleResponse(res);
}

export async function saveJob(token, jobId) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function unsaveJob(token, jobId) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/save`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchSavedJobs(token, page = 1) {
  const res = await fetch(`${API_BASE_URL}/student/saved-jobs?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function reportJob(token, jobId, reason, description) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason, description }),
  });
  return handleResponse(res);
}

// ================= APPLICATIONS =================
export async function applyToJob(token, applicationData) {
  const res = await fetch(`${API_BASE_URL}/student/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(applicationData),
  });
  return handleResponse(res);
}

export async function fetchApplications(token, status = null) {
  const url = status && status !== 'ALL'
    ? `${API_BASE_URL}/student/applications?status=${status}`
    : `${API_BASE_URL}/student/applications`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch applications');
  return data;
}

export async function updateApplicationStatus(token, applicationId, status, note = '') {
  const res = await fetch(`${API_BASE_URL}/student/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, note }),
  });
  return handleResponse(res);
}

export async function updateApplicationNotes(token, applicationId, notes) {
  const res = await fetch(`${API_BASE_URL}/student/applications/${applicationId}/notes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ notes }),
  });
  return handleResponse(res);
}

// ================= RESUMES =================
export async function fetchResumes(token) {
  const res = await fetch(`${API_BASE_URL}/student/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchResumeById(token, resumeId) {
  const res = await fetch(`${API_BASE_URL}/student/resumes/${resumeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createResume(token, resumeData) {
  const res = await fetch(`${API_BASE_URL}/student/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(resumeData),
  });
  return handleResponse(res);
}

export async function updateResume(token, resumeId, resumeData) {
  const res = await fetch(`${API_BASE_URL}/student/resumes/${resumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(resumeData),
  });
  return handleResponse(res);
}

export async function deleteResume(token, resumeId) {
  const res = await fetch(`${API_BASE_URL}/student/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function analyzeResume(token, resumeId, targetRole = 'Full Stack Developer', jobId = null) {
  const res = await fetch(`${API_BASE_URL}/student/resumes/${resumeId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ targetRole, jobId }),
  });
  return handleResponse(res);
}

// ================= PORTFOLIO =================
export async function fetchPortfolio(token) {
  const res = await fetch(`${API_BASE_URL}/student/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updatePortfolio(token, portfolioData) {
  const res = await fetch(`${API_BASE_URL}/student/portfolio`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(portfolioData),
  });
  return handleResponse(res);
}

export async function fetchPublicPortfolio(username, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/portfolio/${username}`, { headers });
  return handleResponse(res);
}

// ================= INTERVIEWS =================
export async function fetchInterviewQuestions(token = null, category = null, difficulty = null) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (difficulty) params.append('difficulty', difficulty);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/interview/questions?${params.toString()}`, { headers });
  return handleResponse(res);
}

export async function startMockInterviewSession(token, config) {
  const res = await fetch(`${API_BASE_URL}/interview/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(config),
  });
  return handleResponse(res);
}

export async function submitInterviewAnswer(token, sessionId, questionIndex, answer) {
  const res = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ questionIndex, answer }),
  });
  return handleResponse(res);
}

export async function fetchInterviewHistory(token) {
  const res = await fetch(`${API_BASE_URL}/interview/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ================= AI CAREER CHAT =================
export async function chatCareerAi(token, message, conversationHistory = []) {
  const res = await fetch(`${API_BASE_URL}/ai/career/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, conversationHistory }),
  });
  return handleResponse(res);
}
