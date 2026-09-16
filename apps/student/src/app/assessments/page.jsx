'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import AssessmentCard from '../../components/assessments/AssessmentCard';
import { useAuth } from '../../context/AuthContext';
import { fetchAssessments } from '../../services/assessmentService';
import {
  Award,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  History,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';

const DIFFICULTIES = ['all', 'Beginner', 'Intermediate', 'Advanced'];
const TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'Quick Quiz', value: 'QUIZ' },
  { label: 'Module Assessment', value: 'MODULE_ASSESSMENT' },
  { label: 'Course Assessment', value: 'COURSE_ASSESSMENT' },
  { label: 'Practice Test', value: 'PRACTICE_TEST' },
];

export default function AssessmentsCatalogPage() {
  const { accessToken } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const loadAssessments = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAssessments(
          {
            page: pageToLoad,
            limit: 12,
            search,
            difficulty: selectedDifficulty,
            type: selectedType,
          },
          accessToken
        );

        setAssessments(data.items || []);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      } catch (err) {
        setError(err.message || 'Unable to load assessments. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [search, selectedDifficulty, selectedType, accessToken]
  );

  useEffect(() => {
    loadAssessments(1);
  }, [loadAssessments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAssessments(1);
  };

  // Find in-progress assessment to highlight
  const inProgressAssessment = assessments.find(
    (a) => a.studentStats?.inProgressAttemptId
  );

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-sm">
              <Award className="w-4 h-4 text-brand-400" />
              Verified Competency & Skills Validation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Assessments & Quizzes
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Validate your technical knowledge with server-evaluated timed quizzes. Receive
              instant granular score reports, complete answer breakdowns, and performance tracking.
            </p>

            {/* Quick Link to History */}
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/assessments/history"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition backdrop-blur-sm"
              >
                <History className="w-3.5 h-3.5" />
                View Assessment History →
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none" />
        </div>

        {/* Continue Assessment Prompt Banner if in progress */}
        {inProgressAssessment && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Active Attempt In Progress
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inProgressAssessment.title}
                </h4>
              </div>
            </div>

            <Link
              href={`/assessments/${inProgressAssessment._id}/play`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              Resume Assessment
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          {/* Search Field */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assessments, topics, keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-brand-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex-shrink-0"
            >
              Search
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {/* Difficulty Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
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

            {/* Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-brand-500 transition"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
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
                Unable to load assessments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadAssessments(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assessments.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <Award className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No assessments available yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Check back soon or try adjusting your filter criteria.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDifficulty('all');
                setSelectedType('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Assessment Cards Grid */}
        {!loading && !error && assessments.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((ass) => (
                <AssessmentCard key={ass._id} assessment={ass} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadAssessments(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => loadAssessments(pagination.page + 1)}
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
