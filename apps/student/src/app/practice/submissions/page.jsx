'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import { practiceService } from '@/services/practiceService';
import { History, ChevronLeft, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SubmissionsHistoryPage() {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [verdictFilter, setVerdictFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await practiceService.getSubmissions({
          verdict: verdictFilter || undefined,
          page,
          limit: 15,
        });
        setSubmissions(res.data.submissions || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [verdictFilter, page]);

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Accepted
          </span>
        );
      case 'WRONG_ANSWER':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Wrong Answer
          </span>
        );
      case 'TIME_LIMIT_EXCEEDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            TLE
          </span>
        );
      case 'COMPILE_ERROR':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Compile Error
          </span>
        );
      case 'RUNTIME_ERROR':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Runtime Error
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {verdict}
          </span>
        );
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Submission History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit log of all code executions evaluated against the judge engine
              </p>
            </div>
          </div>

          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => {
              setVerdictFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Verdicts</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="WRONG_ANSWER">Wrong Answer</option>
            <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
            <option value="COMPILE_ERROR">Compilation Error</option>
            <option value="RUNTIME_ERROR">Runtime Error</option>
          </select>
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <div className="text-xs">Loading submissions...</div>
            </div>
          ) : submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Problem</th>
                    <th className="px-5 py-3">Language</th>
                    <th className="px-5 py-3">Verdict</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Runtime</th>
                    <th className="px-5 py-3">Submitted At</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {submissions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {sub.problemId ? (
                          <Link
                            href={`/practice/problems/${sub.problemId.slug}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {sub.problemId.title}
                          </Link>
                        ) : (
                          'Problem'
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 uppercase text-[11px]">
                        {sub.language}
                      </td>
                      <td className="px-5 py-3.5">{getVerdictBadge(sub.verdict)}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {sub.score}%
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {sub.executionTime ? `${sub.executionTime} ms` : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(sub.submittedAt || sub.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/practice/submissions/${sub._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No submissions found
              </div>
              <p className="text-xs text-slate-500 mt-1">
                You haven&apos;t submitted any practice problems yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
