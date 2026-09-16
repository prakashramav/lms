'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import CourseCard from '../../components/courses/CourseCard';
import { useAuth } from '../../context/AuthContext';
import { fetchCourses, fetchEnrollments } from '../../services/courseService';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

const CATEGORIES = [
  'all',
  'Web Development',
  'Frontend',
  'Backend',
  'Full Stack',
  'System Design',
  'Mobile Development',
  'DevOps',
  'Data Science & AI',
];

const DIFFICULTIES = ['all', 'Beginner', 'Intermediate', 'Advanced'];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Shortest Duration', value: 'shortest' },
  { label: 'Longest Duration', value: 'longest' },
];

export default function LearningCatalogPage() {
  const { accessToken } = useAuth();

  // State
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Load user enrollments
  useEffect(() => {
    if (accessToken) {
      fetchEnrollments(accessToken)
        .then((data) => setEnrollments(data || []))
        .catch(() => setEnrollments([]));
    }
  }, [accessToken]);

  // Load courses
  const loadCourses = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCourses({
          page: pageToLoad,
          limit: 12,
          search,
          category: selectedCategory,
          difficulty: selectedDifficulty,
          sort: selectedSort,
        });

        setCourses(data.items || []);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      } catch (err) {
        setError(err.message || 'Unable to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, selectedDifficulty, selectedSort]
  );

  useEffect(() => {
    loadCourses(1);
  }, [loadCourses]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCourses(1);
  };

  // Map enrollment by courseId
  const enrollmentMap = new Map();
  enrollments.forEach((e) => {
    const cid = typeof e.courseId === 'object' ? e.courseId._id : e.courseId;
    if (cid) enrollmentMap.set(cid.toString(), e);
  });

  // Featured courses
  const featuredCourses = courses.filter((c) => c.featured);

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Page Hero Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 border border-brand-800/40 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-sm">
              <GraduationCap className="w-4 h-4 text-brand-400" />
              Course Catalog & Curriculum Explorer
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Level Up with Industry-Standard Curriculums
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore step-by-step learning tracks crafted by software architects. Gain real
              hands-on competency from foundations to production mastery.
            </p>

            {/* Search Input in Hero */}
            <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses, skills, technologies..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-brand-400 text-white placeholder-slate-400 text-sm outline-none transition backdrop-blur-md"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/30 transition flex-shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Background Decorative Accents */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Continue Learning Strip if student is enrolled in courses */}
        {enrollments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Enrolled Tracks
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {enrollments.length} Active {enrollments.length === 1 ? 'Track' : 'Tracks'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.slice(0, 3).map((enr) => {
                const c = enr.courseId;
                if (!c || typeof c !== 'object') return null;
                return <CourseCard key={enr._id} course={c} enrollment={enr} />;
              })}
            </div>
          </div>
        )}

        {/* Filter Controls & Bar */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-650'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              );
            })}
          </div>

          {/* Secondary Filter Line: Difficulty + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            {/* Difficulty Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Level:
              </span>
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    selectedDifficulty === diff
                      ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {diff === 'all' ? 'All' : diff}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-brand-500 transition"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-4 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unable to load courses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadCourses(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No courses found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try adjusting your search terms or clearing selected filter criteria.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Main Courses Grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  enrollment={enrollmentMap.get(course._id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} courses total)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadCourses(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => loadCourses(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
