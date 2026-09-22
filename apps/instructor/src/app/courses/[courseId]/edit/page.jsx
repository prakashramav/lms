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
  deleteCourse,
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
  Trash2,
  X,
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

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState(null);

  // Accessible escape key handling for delete modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDeleteModalOpen && !isDeletingCourse) {
        setIsDeleteModalOpen(false);
        setDeleteInputText('');
        setDeleteErrorMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteModalOpen, isDeletingCourse]);

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
    if (!accessToken || !courseId || courseId === 'undefined') return;
    setIsLoading(true);
    try {
      const data = await fetchCourseDetail(accessToken, courseId);
      const courseObj = data?.course || data;
      const mergedCourse = {
        ...courseObj,
        modules: data?.modules || courseObj?.modules || [],
        resources: data?.resources || courseObj?.resources || [],
        metrics: data?.metrics || courseObj?.metrics || {},
      };
      setCourse(mergedCourse);
      setFormData({
        title: mergedCourse.title || '',
        slug: mergedCourse.slug || '',
        shortDescription: mergedCourse.shortDescription || '',
        description: mergedCourse.description || '',
        category: mergedCourse.category || '',
        level: mergedCourse.difficulty || mergedCourse.level || 'Beginner',
        language: mergedCourse.language || 'English',
        thumbnail: mergedCourse.thumbnail || '',
        banner: mergedCourse.banner || '',
        estimatedDuration: mergedCourse.duration || mergedCourse.estimatedDuration || 10,
        learningObjectives: (mergedCourse.learningOutcomes || mergedCourse.learningObjectives || []).join('\n'),
        prerequisites: (mergedCourse.requirements || mergedCourse.prerequisites || []).join('\n'),
        tags: (mergedCourse.skills || mergedCourse.tags || []).join(', '),
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
    if (courseId === 'undefined') {
      router.replace('/courses');
      return;
    }
    loadCourseData();
  }, [accessToken, courseId]);

  // Lazy load tab specific data
  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;
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
      const updatedCourseObj = updated?.course || updated;
      setCourse((prev) => ({
        ...prev,
        ...updatedCourseObj,
      }));
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
      const updatedCourseObj = updated?.course || updated;
      setCourse((prev) => ({
        ...prev,
        ...updatedCourseObj,
      }));
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
      const updatedCourseObj = updated?.course || updated;
      setCourse((prev) => ({
        ...prev,
        ...updatedCourseObj,
      }));
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

  const handleDeleteCourse = async (e) => {
    if (e) e.preventDefault();
    if (deleteInputText.trim() !== (course?.title || '').trim()) return;
    setIsDeletingCourse(true);
    setDeleteErrorMessage(null);
    try {
      const targetId = course?._id || courseId;
      await deleteCourse(accessToken, targetId);
      setIsDeleteModalOpen(false);
      router.push('/courses');
    } catch (err) {
      console.error('Failed to delete course:', err);
      setDeleteErrorMessage(err.message || 'Failed to delete course');
      setIsDeletingCourse(false);
    }
  };

  if (!courseId || courseId === 'undefined') {
    return (
      <InstructorLayout>
        <div className="max-w-4xl mx-auto p-12 text-center text-slate-400 space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Course Not Specified</h2>
          <p className="text-sm text-slate-400">Invalid course identifier. Please select a course from your studio catalog.</p>
          <Link
            href="/courses"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition"
          >
            Back to Courses
          </Link>
        </div>
      </InstructorLayout>
    );
  }

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
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage destructive operations for this course. Archiving hides the course from the catalog while preserving enrollments. Permanent deletion purges all modules, lessons, and assets.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={course.status === 'ARCHIVED' || isSaving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-40"
                >
                  {course.status === 'ARCHIVED' ? 'Course is Archived' : 'Archive Course'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteInputText('');
                    setDeleteErrorMessage(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Course Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course-modal-title"
          >
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-900/60 shadow-2xl overflow-hidden animate-in zoom-in-95">
              {/* MODAL HEADER */}
              <div className="p-6 bg-rose-950/40 border-b border-rose-900/40 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 id="delete-course-modal-title" className="text-base font-bold text-white">
                      Delete Course Permanently?
                    </h3>
                    <p className="text-xs text-rose-300/80 mt-0.5 font-mono truncate max-w-xs sm:max-w-sm">
                      {course?.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeletingCourse) {
                      setIsDeleteModalOpen(false);
                      setDeleteInputText('');
                      setDeleteErrorMessage(null);
                    }
                  }}
                  disabled={isDeletingCourse}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-40"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-2 text-xs text-rose-200">
                  <p className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Warning: This action is destructive and irreversible.</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>All modules ({course?.modules?.length || 0}) and lessons will be permanently deleted.</li>
                    <li>Course quizzes, exercises, and attached learning resources will be removed.</li>
                    <li>Enrolled student progress telemetry for this course will be deleted.</li>
                    <li>AI RAG knowledge embeddings will be purged immediately.</li>
                    <li className="text-emerald-400">
                      <strong>Certificate Preservation:</strong> Any certificates already awarded to students remain valid and verifiable.
                    </li>
                  </ul>
                </div>

                {deleteErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {deleteErrorMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    To verify, type <span className="font-mono text-rose-400 font-bold select-all">{course?.title}</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteInputText}
                    onChange={(e) => setDeleteInputText(e.target.value)}
                    placeholder="Enter course name exactly to confirm"
                    disabled={isDeletingCourse}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteInputText('');
                    setDeleteErrorMessage(null);
                  }}
                  disabled={isDeletingCourse}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  disabled={deleteInputText.trim() !== (course?.title || '').trim() || isDeletingCourse}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-30 disabled:hover:bg-rose-600 flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {isDeletingCourse ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Course...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Course Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
