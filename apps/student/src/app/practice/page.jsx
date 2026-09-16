'use client';

import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import ProblemCard from '@/components/practice/ProblemCard';
import PracticeStatsCard from '@/components/practice/PracticeStatsCard';
import { practiceService } from '@/services/practiceService';
import { Search, Filter, Terminal, Sparkles, BookOpen, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import Link from 'next/link';

export default function PracticeCatalogPage() {
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState(''); // 'SOLVED', 'UNSOLVED', 'BOOKMARKED'
  const [page, setPage] = useState(1);

  const fetchCatalog = React.useCallback(async () => {
    setLoading(true);
    try {
      const [problemsRes, statsRes] = await Promise.all([
        practiceService.getProblems({
          search,
          category,
          difficulty,
          language,
          status,
          page,
          limit: 12,
        }),
        practiceService.getPracticeProgress().catch(() => ({ data: null })),
      ]);

      setProblems(problemsRes.data.problems || []);
      setPagination(problemsRes.data.pagination || { page: 1, pages: 1, total: 0 });
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load practice catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, difficulty, language, status, page]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 shadow-xl border border-blue-800/40">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/30">
              <Terminal className="w-3.5 h-3.5" />
              <span>Phase 6 Online Judge & Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Interactive Coding Practice
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Sharpen your engineering skills across JavaScript, HTML/CSS, React, Node.js, and Express.js with our secure online judge and live preview sandbox.
            </p>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <Link
                href="/practice/submissions"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors"
              >
                Submission History
              </Link>
              <Link
                href="/practice/bookmarks"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarked Problems
              </Link>
            </div>
          </div>
        </div>

        {/* Practice Statistics Card */}
        {stats && <PracticeStatsCard stats={stats} />}

        {/* Search & Filters Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by problem title, topic, or tag..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="HTML_CSS">HTML & CSS</option>
                <option value="REACT">React</option>
                <option value="NODE">Node.js</option>
                <option value="EXPRESS">Express.js</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="SOLVED">Solved</option>
                <option value="UNSOLVED">Unsolved</option>
                <option value="BOOKMARKED">Bookmarked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-56 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : problems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No problems found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or resetting filters to explore the full catalog.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} problems)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
