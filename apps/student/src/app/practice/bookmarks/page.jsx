'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import ProblemCard from '@/components/practice/ProblemCard';
import { practiceService } from '@/services/practiceService';
import { Bookmark, ChevronLeft, BookOpen } from 'lucide-react';

export default function BookmarkedProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await practiceService.getBookmarks();
      setProblems(res.data || []);
    } catch (err) {
      console.error('Failed to load bookmarked problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (problemId, isBookmarked) => {
    if (!isBookmarked) {
      setProblems((prev) => prev.filter((p) => p._id !== problemId));
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" />
                <span>Bookmarked Problems</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick access to problems you saved for focused practice
              </p>
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-56 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : problems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={{ ...problem, isBookmarked: true }}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center">
            <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No bookmarked problems yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
              Bookmark challenging problems from the catalog to return to them anytime.
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
            >
              Browse Problems
            </Link>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
