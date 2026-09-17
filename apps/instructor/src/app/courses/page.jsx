'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCourses,
  publishCourse,
  unpublishCourse,
  archiveCourse,
  duplicateCourse,
} from '../../services/instructorService';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  FileText,
  Users,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  Edit,
  Copy,
  Archive,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export default function CoursesListPage() {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadCourses = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = {};
      if (statusFilter !== 'all') query.status = statusFilter;
      if (searchQuery.trim()) query.search = searchQuery.trim();
      const res = await fetchCourses(accessToken, query);
      setCourses(res.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [accessToken, statusFilter, searchQuery]);

  const handlePublish = async (courseId) => {
    setActionLoadingId(courseId);
    setFeedback(null);
    try {
      await publishCourse(accessToken, courseId);
      setFeedback({ type: 'success', message: 'Course published successfully!' });
      await loadCourses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish course' });
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  const handleUnpublish = async (courseId) => {
    if (!confirm('Unpublishing will prevent new students from enrolling in this course. Continue?')) return;
    setActionLoadingId(courseId);
    setFeedback(null);
    try {
      await unpublishCourse(accessToken, courseId);
      setFeedback({ type: 'success', message: 'Course unpublished (returned to draft).' });
      await loadCourses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to unpublish course' });
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  const handleDuplicate = async (courseId) => {
    setActionLoadingId(courseId);
    setFeedback(null);
    try {
      await duplicateCourse(accessToken, courseId);
      setFeedback({ type: 'success', message: 'Course duplicated as a new draft.' });
      await loadCourses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate course' });
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  const handleArchive = async (courseId) => {
    if (!confirm('Are you sure you want to archive this course? Existing student enrollments will be preserved.')) return;
    setActionLoadingId(courseId);
    setFeedback(null);
    try {
      await archiveCourse(accessToken, courseId);
      setFeedback({ type: 'success', message: 'Course archived successfully.' });
      await loadCourses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to archive course' });
    } finally {
      setActionLoadingId(null);
      setActiveMenuId(null);
    }
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Course Management</h1>
            <p className="text-sm text-slate-400">
              Create, organize, and publish industry-ready engineering courses
            </p>
          </div>

          <Link
            href="/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </Link>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CONTROLS: SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search courses by title, slug, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['all', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  statusFilter === status
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {status === 'all' ? 'All Status' : status.toLowerCase()}
              </button>
            ))}
            <button
              onClick={loadCourses}
              disabled={isLoading}
              title="Refresh"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadCourses} className="underline text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* COURSE LISTING GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No courses found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter query.'
                  : 'Start designing your curriculum by creating your first course.'}
              </p>
            </div>
            <Link
              href="/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Course</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isActionLoading = actionLoadingId === course._id;
              const isMenuOpen = activeMenuId === course._id;

              return (
                <div
                  key={course._id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-lg hover:shadow-teal-950/20"
                >
                  {/* CARD HEADER & THUMBNAIL */}
                  <div>
                    <div className="relative h-44 bg-slate-950 overflow-hidden border-b border-slate-800">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950/30 to-slate-900 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-teal-500/40" />
                        </div>
                      )}

                      {/* BADGES */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            course.status === 'PUBLISHED'
                              ? 'bg-emerald-500/90 text-white'
                              : course.status === 'DRAFT'
                              ? 'bg-amber-500/90 text-slate-950'
                              : 'bg-slate-700/90 text-slate-200'
                          }`}
                        >
                          {course.status}
                        </span>
                        {course.level && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 backdrop-blur-sm text-slate-300 border border-slate-700">
                            {course.level}
                          </span>
                        )}
                      </div>

                      {/* CARD MENU */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : course._id)}
                          className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-slate-300 hover:text-white border border-slate-700/60"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 z-20 space-y-0.5">
                            <Link
                              href={`/courses/${course._id}/edit`}
                              className="w-full px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5 text-teal-400" />
                              <span>Edit Studio</span>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(course._id)}
                              className="w-full px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 text-left"
                            >
                              <Copy className="w-3.5 h-3.5 text-sky-400" />
                              <span>Duplicate Course</span>
                            </button>
                            {course.status === 'DRAFT' && (
                              <button
                                onClick={() => handlePublish(course._id)}
                                className="w-full px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-2 text-left"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Publish Course</span>
                              </button>
                            )}
                            {course.status === 'PUBLISHED' && (
                              <button
                                onClick={() => handleUnpublish(course._id)}
                                className="w-full px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-2 text-left"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Unpublish (Draft)</span>
                              </button>
                            )}
                            {course.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleArchive(course._id)}
                                className="w-full px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 text-left"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive Course</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {course.shortDescription || course.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* STATS ROW */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center text-xs">
                        <div>
                          <span className="block font-bold text-white">{course.modules?.length || 0}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Modules</span>
                        </div>
                        <div>
                          <span className="block font-bold text-white">
                            {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Lessons</span>
                        </div>
                        <div>
                          <span className="block font-bold text-white">{course.enrolledCount || 0}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Students</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Updated {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course._id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <span>Open Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
