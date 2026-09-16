'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../../components/layout/StudentLayout';
import { useAuth } from '../../../context/AuthContext';
import { fetchAssessmentHistory } from '../../../services/assessmentService';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export default function AssessmentHistoryPage() {
  const { accessToken } = useAuth();

  const [historyData, setHistoryData] = useState({ items: [], total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(
    async (pageToLoad = 1) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAssessmentHistory({ page: pageToLoad, limit: 10 }, accessToken);
        setHistoryData(data);
      } catch (err) {
        setError(err.message || 'Unable to load assessment history.');
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const attempts = historyData.items || [];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/assessments"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition"
              title="Back to Assessments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                Assessment History & Transcripts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Chronological record of all submitted quiz and test attempts.
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {historyData.total} Total Attempts Recorded
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
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
                Unable to load history
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadHistory(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && attempts.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <History className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                You haven&apos;t completed any assessments yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Take timed quizzes and practice tests to build your technical verification history.
              </p>
            </div>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
            >
              Browse Assessments
            </Link>
          </div>
        )}

        {/* History Attempts Table */}
        {!loading && !error && attempts.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              {attempts.map((att) => {
                const isPassed = att.passed;
                const minutes = Math.floor((att.timeSpent || 0) / 60);
                const seconds = (att.timeSpent || 0) % 60;
                const ass = att.assessmentId || {};

                return (
                  <div
                    key={att._id}
                    className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-750 transition"
                  >
                    {/* Left: Title, Date, Attempt Number */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {ass.type || 'QUIZ'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPassed
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {isPassed ? 'PASSED' : 'DID NOT PASS'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Attempt #{att.attemptNumber}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {ass.title || 'Assessment'}
                      </h3>

                      <p className="text-xs text-slate-400">
                        Submitted{' '}
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Incomplete'}
                      </p>
                    </div>

                    {/* Middle: Score & Time */}
                    <div className="flex items-center gap-6 text-left md:text-right flex-shrink-0">
                      <div>
                        <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
                          {att.percentage}%
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {att.score} points awarded
                        </p>
                      </div>

                      <div>
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {minutes}m {seconds}s
                        </span>
                        <p className="text-[10px] text-slate-400">Time spent</p>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/assessments/${ass._id || att.assessmentId}/results/${att._id}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                        >
                          Score Report
                        </Link>
                        <Link
                          href={`/assessments/${ass._id || att.assessmentId}/review/${att._id}`}
                          className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {historyData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400">
                  Page {historyData.page} of {historyData.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadHistory(historyData.page - 1)}
                    disabled={historyData.page <= 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => loadHistory(historyData.page + 1)}
                    disabled={historyData.page >= historyData.totalPages}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
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
