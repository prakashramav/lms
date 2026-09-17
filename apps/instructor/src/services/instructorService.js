const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function getHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function handleResponse(res, fallbackMessage = 'Request failed') {
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.message || fallbackMessage);
    error.status = res.status;
    error.errorCode = json.errorCode;
    throw error;
  }
  return json.data !== undefined ? json.data : json;
}

// ==========================================
// COURSES
// ==========================================

export async function fetchCourses(accessToken, query = {}) {
  const params = new URLSearchParams();
  Object.keys(query).forEach((key) => {
    if (query[key] !== undefined && query[key] !== 'all') {
      params.set(key, query[key]);
    }
  });

  const res = await fetch(`${API_BASE_URL}/instructor/courses?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch courses');
}

export async function createCourse(accessToken, courseData) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(courseData),
  });
  return handleResponse(res, 'Failed to create course');
}

export async function fetchCourseDetail(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch course details');
}

export async function updateCourse(accessToken, courseId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update course');
}

export async function publishCourse(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/publish`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to publish course');
}

export async function unpublishCourse(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/unpublish`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to unpublish course');
}

export async function archiveCourse(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to archive course');
}

export async function duplicateCourse(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/duplicate`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to duplicate course');
}

// ==========================================
// MODULES & LESSONS
// ==========================================

export async function addModule(accessToken, courseId, moduleData) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/modules`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(moduleData),
  });
  return handleResponse(res, 'Failed to create module');
}

export async function updateModule(accessToken, moduleId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/modules/${moduleId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update module');
}

export async function deleteModule(accessToken, moduleId) {
  const res = await fetch(`${API_BASE_URL}/instructor/modules/${moduleId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete module');
}

export async function reorderModules(accessToken, courseId, moduleIds) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/modules/reorder`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ moduleIds }),
  });
  return handleResponse(res, 'Failed to reorder modules');
}

export async function addLesson(accessToken, moduleId, lessonData) {
  const res = await fetch(`${API_BASE_URL}/instructor/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(lessonData),
  });
  return handleResponse(res, 'Failed to create lesson');
}

export async function updateLesson(accessToken, lessonId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update lesson');
}

export async function deleteLesson(accessToken, lessonId) {
  const res = await fetch(`${API_BASE_URL}/instructor/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete lesson');
}

export async function reorderLessons(accessToken, moduleId, lessonIds) {
  const res = await fetch(`${API_BASE_URL}/instructor/modules/${moduleId}/lessons/reorder`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ lessonIds }),
  });
  return handleResponse(res, 'Failed to reorder lessons');
}

// ==========================================
// RESOURCES & MEDIA UPLOADS
// ==========================================

export async function uploadFile(accessToken, { name, data, mimeType, folder = 'resources' }) {
  const res = await fetch(`${API_BASE_URL}/instructor/upload`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ name, data, mimeType, folder }),
  });
  return handleResponse(res, 'Failed to upload file');
}

export async function attachResource(accessToken, lessonId, resourceData) {
  const res = await fetch(`${API_BASE_URL}/instructor/lessons/${lessonId}/resources`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(resourceData),
  });
  return handleResponse(res, 'Failed to attach resource');
}

export async function deleteResource(accessToken, resourceId) {
  const res = await fetch(`${API_BASE_URL}/instructor/resources/${resourceId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete resource');
}

// ==========================================
// ASSESSMENTS & QUESTIONS
// ==========================================

export async function fetchAssessments(accessToken, query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_BASE_URL}/instructor/assessments?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch assessments');
}

export async function createAssessment(accessToken, data) {
  const res = await fetch(`${API_BASE_URL}/instructor/assessments`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create assessment');
}

export async function fetchAssessmentDetail(accessToken, assessmentId) {
  const res = await fetch(`${API_BASE_URL}/instructor/assessments/${assessmentId}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch assessment details');
}

export async function updateAssessment(accessToken, assessmentId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/assessments/${assessmentId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update assessment');
}

export async function deleteAssessment(accessToken, assessmentId) {
  const res = await fetch(`${API_BASE_URL}/instructor/assessments/${assessmentId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete assessment');
}

export async function fetchQuestionBank(accessToken, query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_BASE_URL}/instructor/questions?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch questions');
}

export async function createQuestion(accessToken, questionData) {
  const res = await fetch(`${API_BASE_URL}/instructor/questions`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(questionData),
  });
  return handleResponse(res, 'Failed to add question');
}

export async function updateQuestion(accessToken, questionId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/questions/${questionId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update question');
}

export async function deleteQuestion(accessToken, questionId) {
  const res = await fetch(`${API_BASE_URL}/instructor/questions/${questionId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete question');
}

export async function duplicateQuestion(accessToken, questionId, targetAssessmentId) {
  const res = await fetch(`${API_BASE_URL}/instructor/questions/${questionId}/duplicate`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ targetAssessmentId }),
  });
  return handleResponse(res, 'Failed to duplicate question');
}

// ==========================================
// CODING PROBLEMS
// ==========================================

export async function fetchProblems(accessToken, query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_BASE_URL}/instructor/problems?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch coding problems');
}

export async function createProblem(accessToken, problemData) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(problemData),
  });
  return handleResponse(res, 'Failed to create coding problem');
}

export async function fetchProblemDetail(accessToken, problemId) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch coding problem details');
}

export async function updateProblem(accessToken, problemId, updateData) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updateData),
  });
  return handleResponse(res, 'Failed to update coding problem');
}

export async function publishProblem(accessToken, problemId) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}/publish`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to publish coding problem');
}

export async function unpublishProblem(accessToken, problemId) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}/unpublish`, {
    method: 'POST',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to unpublish coding problem');
}

export async function deleteProblem(accessToken, problemId) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete coding problem');
}

export async function addTestCase(accessToken, problemId, testCaseData) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}/test-cases`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(testCaseData),
  });
  return handleResponse(res, 'Failed to add test case');
}

export async function deleteTestCase(accessToken, problemId, testCaseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/problems/${problemId}/test-cases/${testCaseId}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to delete test case');
}

// ==========================================
// STUDENTS & ANALYTICS
// ==========================================

export async function fetchStudents(accessToken, query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_BASE_URL}/instructor/students?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch enrolled students');
}

export async function fetchStudentDetail(accessToken, courseId, studentId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/students/${studentId}`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch student progress detail');
}

export async function fetchOverviewAnalytics(accessToken) {
  const res = await fetch(`${API_BASE_URL}/instructor/analytics/overview`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to load overview analytics');
}

export async function fetchCourseAnalytics(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/analytics`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to load course analytics');
}

// ==========================================
// AI AUTHORING ASSISTANT
// ==========================================

export async function generateLessonOutline(accessToken, { topic, level = 'Beginner', courseContext = '' }) {
  const res = await fetch(`${API_BASE_URL}/instructor/ai/generate-outline`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ topic, level, courseContext }),
  });
  return handleResponse(res, 'Failed to generate outline');
}

export async function generateQuestions(accessToken, { topic, difficulty = 'Intermediate', count = 3 }) {
  const res = await fetch(`${API_BASE_URL}/instructor/ai/generate-questions`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ topic, difficulty, count }),
  });
  return handleResponse(res, 'Failed to generate questions');
}

export async function generateCodingProblem(accessToken, { topic, difficulty = 'EASY' }) {
  const res = await fetch(`${API_BASE_URL}/instructor/ai/generate-problem`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ topic, difficulty }),
  });
  return handleResponse(res, 'Failed to generate problem draft');
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function fetchNotifications(accessToken) {
  const res = await fetch(`${API_BASE_URL}/instructor/notifications`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch notifications');
}

export async function markNotificationRead(accessToken, notificationId = 'all') {
  const res = await fetch(`${API_BASE_URL}/instructor/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
  });
  return handleResponse(res, 'Failed to update notification');
}

// ==========================================
// PHASE 11: COURSE INTELLIGENCE
// ==========================================

export async function fetchCourseIntelligence(accessToken, courseId) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/intelligence`, {
    method: 'GET',
    headers: getHeaders(accessToken),
    cache: 'no-store',
  });
  return handleResponse(res, 'Failed to fetch course intelligence');
}

