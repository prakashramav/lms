'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import InstructorLayout from '../../../../components/layout/InstructorLayout';
import CurriculumBuilder from '../../../../components/curriculum/CurriculumBuilder';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchCourseDetail,
  updateCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
  fetchCourseAnalytics,
  fetchStudents,
} from '../../../../services/instructorService';
import {
  ArrowLeft,
  BookOpen,
  FolderTree,
  FileText,
  FileQuestion,
  Code2,
  FolderArchive,
  Users,
  BarChart3,
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCw,
  Eye,
  AlertTriangle,
  Layers,
  ChevronRight,
} from 'lucide-react';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', icon: FolderTree },
  { id: 'overview', label: 'Overview & Metadata', icon: BookOpen },
  { id: 'assessments', label: 'Assessments', icon: FileQuestion },
  { id: 'coding', label: 'Coding Problems', icon: Code2 },
  { id: 'students', label: 'Enrolled Cohort', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Publishing & Settings', icon: Settings },
];

export default function CourseEditorPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [course, setCourse] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [feedback, setFeedback] = useState(null);

  // Form state for overview tab
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: '',
    level: 'Beginner',
    language: 'English',
    thumbnail: '',
    banner: '',
    estimatedDuration: 10,
    learningObjectives: '',
    prerequisites: '',
    tags: '',
  });

  const loadCourseData = async () => {
    if (!accessToken || !courseId) return;
    setIsLoading(true);
    try {
      const data = await fetchCourseDetail(accessToken, courseId);
      setCourse(data);
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        category: data.category || '',
        level: data.level || 'Beginner',
        language: data.language || 'English',
        thumbnail: data.thumbnail || '',
        banner: data.banner || '',
        estimatedDuration: data.estimatedDuration || 10,
        learningObjectives: (data.learningObjectives || []).join('\n'),
        prerequisites: (data.prerequisites || []).join('\n'),
        tags: (data.tags || []).join(', '),
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to load course:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load course' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [accessToken, courseId]);

  // Lazy load tab specific data
  useEffect(() => {
    if (activeTab === 'analytics' && !analytics && accessToken) {
      fetchCourseAnalytics(accessToken, courseId)
        .then((res) => setAnalytics(res))
        .catch(() => {});
    } else if (activeTab === 'students' && students.length === 0 && accessToken) {
      fetchStudents(accessToken, { courseId })
        .then((res) => setStudents(res.students || []))
        .catch(() => {});
    }
  }, [activeTab, courseId, accessToken]);

  const handleOverviewChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('unsaved');
  };

  const handleSaveOverview = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus('saving');
    setFeedback(null);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        language: formData.language,
        thumbnail: formData.thumbnail.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        estimatedDuration: Number(formData.estimatedDuration) || 10,
        learningObjectives: formData.learningObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        prerequisites: formData.prerequisites
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: formData.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const updated = await updateCourse(accessToken, courseId, payload);
      setCourse(updated);
      setSaveStatus('saved');
      setFeedback({ type: 'success', message: 'Course overview updated successfully!' });
    } catch (err) {
      setSaveStatus('error');
      setFeedback({ type: 'error', message: err.message || 'Failed to update course' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await publishCourse(accessToken, courseId);
      setCourse(updated);
      setFeedback({ type: 'success', message: 'Course published! Students can now access this course.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish course.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Unpublishing will prevent new enrollments. Proceed?')) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await unpublishCourse(accessToken, courseId);
      setCourse(updated);
      setFeedback({ type: 'success', message: 'Course returned to Draft state.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to unpublish course.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this course?')) return;
    setIsSaving(true);
    try {
      await archiveCourse(accessToken, courseId);
      router.push('/courses');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to archive course.' });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <InstructorLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-slate-900 rounded-2xl" />
          <div className="h-96 bg-slate-900 rounded-2xl" />
        </div>
      </InstructorLayout>
    );
  }

  if (!course) {
    return (
      <InstructorLayout>
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Course Not Found</h2>
          <p className="text-xs text-slate-400">The course may have been removed or access is restricted.</p>
          <Link href="/courses" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
            Return to Courses
          </Link>
        </div>
      </InstructorLayout>
    );
  }

  // Publishing validation rules checklist
  const validationRules = [
    { label: 'Course title defined', valid: !!course.title?.trim() },
    { label: 'Full description provided', valid: !!course.description?.trim() },
    { label: 'At least one module created', valid: course.modules && course.modules.length > 0 },
    {
      label: 'At least one published lesson',
      valid: course.modules?.some((m) => m.lessons && m.lessons.length > 0),
    },
    { label: 'Unique URL slug set', valid: !!course.slug?.trim() },
  ];
  const canPublish = validationRules.every((r) => r.valid);

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* TOP BREADCRUMB & STATUS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="All Courses"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight truncate max-w-md">
                  {course.title}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    course.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : course.status === 'DRAFT'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {course.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Slug: <span className="font-mono text-slate-300">{course.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Autosave / status indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <span className="text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 animate-spin text-teal-400" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Unsaved changes
                </span>
              )}
            </div>

            {/* Preview Button */}
            <a
              href={`http://localhost:3000/courses/${course.slug || course._id}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Student Preview</span>
            </a>

            {/* Quick Publish Toggle */}
            {course.status === 'DRAFT' ? (
              <button
                onClick={handlePublish}
                disabled={!canPublish || isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Course</span>
              </button>
            ) : (
              <button
                onClick={handleUnpublish}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* TABS HEADER */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CURRICULUM BUILDER */}
        {activeTab === 'curriculum' && (
          <CurriculumBuilder
            course={course}
            accessToken={accessToken}
            onRefresh={loadCourseData}
          />
        )}

        {/* TAB 2: OVERVIEW & METADATA */}
        {activeTab === 'overview' && (
          <form onSubmit={handleSaveOverview} className="space-y-6 max-w-4xl">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Course Metadata</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleOverviewChange('title', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleOverviewChange('slug', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Short Description / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleOverviewChange('shortDescription', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Full Course Syllabus & Description
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => handleOverviewChange('description', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Thumbnail Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => handleOverviewChange('thumbnail', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleOverviewChange('level', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Learning Objectives (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.learningObjectives}
                      onChange={(e) => handleOverviewChange('learningObjectives', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Prerequisites (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.prerequisites}
                      onChange={(e) => handleOverviewChange('prerequisites', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Overview'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: ASSESSMENTS */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Course Quizzes & Assessments</h3>
                <p className="text-xs text-slate-400">Integrated Phase 5 evaluation engine</p>
              </div>
              <Link
                href="/assessments"
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Assessment Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <FileQuestion className="w-10 h-10 text-teal-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Curriculum Assessments</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Author quizzes directly in the Curriculum tab by adding a lesson with type &quot;Quiz / Assessment&quot; or assemble questions in the central Question Bank.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: CODING PROBLEMS */}
        {activeTab === 'coding' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Hands-On Coding Challenges</h3>
                <p className="text-xs text-slate-400">Phase 6 automated judge integration</p>
              </div>
              <Link
                href="/practice"
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Coding Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <Code2 className="w-10 h-10 text-sky-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Automated Sandbox Judge</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Design algorithmic challenges with public &amp; hidden test cases, memory limits, and starter code skeletons.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: STUDENTS */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Enrolled Students</h3>
                <p className="text-xs text-slate-400">
                  {students.length} students currently enrolled in this course
                </p>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                No students enrolled in this course yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Enrolled Date</th>
                      <th className="p-3.5">Progress</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {students.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-800/50">
                        <td className="p-3.5 font-medium text-white">
                          <div>{st.studentName || 'Student'}</div>
                          <div className="text-[11px] text-slate-500">{st.studentEmail}</div>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(st.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{st.progress || 0}%</span>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-teal-500 h-1.5 rounded-full"
                                style={{ width: `${st.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {st.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs uppercase text-slate-400 font-bold">Total Enrollments</span>
                <p className="text-2xl font-extrabold text-white">{analytics?.enrollments || 0}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs uppercase text-slate-400 font-bold">Active Students</span>
                <p className="text-2xl font-extrabold text-teal-400">{analytics?.activeStudents || 0}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs uppercase text-slate-400 font-bold">Completion Rate</span>
                <p className="text-2xl font-extrabold text-emerald-400">{analytics?.completionRate || 0}%</p>
              </div>
            </div>

            {/* DROP OFF & LESSON COMPLETION */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white">Lesson Drop-off & Telemetry</h4>
              {!analytics?.lessonPerformance || analytics.lessonPerformance.length === 0 ? (
                <p className="text-xs text-slate-500">Analytics will appear once students begin learning.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.lessonPerformance.map((lp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                      <span className="text-slate-200">{lp.title}</span>
                      <span className="text-teal-400 font-semibold">{lp.completions} completions</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: PUBLISHING & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            {/* PUBLISHING CHECKLIST CARD */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Course Publication Readiness Checklist</h3>
              <p className="text-xs text-slate-400">
                To guarantee production quality, your course must satisfy the following architectural criteria before publication:
              </p>

              <div className="space-y-2.5 pt-2">
                {validationRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium ${
                      rule.valid
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {rule.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Current Status: </span>
                  <span className="text-xs font-bold text-white">{course.status}</span>
                </div>

                {course.status === 'DRAFT' ? (
                  <button
                    onClick={handlePublish}
                    disabled={!canPublish || isSaving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition"
                  >
                    Publish to Student Marketplace
                  </button>
                ) : (
                  <button
                    onClick={handleUnpublish}
                    disabled={isSaving}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Unpublish (Return to Draft)
                  </button>
                )}
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-4">
              <h3 className="text-sm font-bold text-rose-400">Danger Zone</h3>
              <p className="text-xs text-slate-400">
                Archiving will hide the course from discovery. Existing student enrollments will remain protected.
              </p>
              <button
                onClick={handleArchive}
                disabled={course.status === 'ARCHIVED' || isSaving}
                className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
              >
                Archive Course
              </button>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
