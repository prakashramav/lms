'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../../../components/layout/StudentLayout';
import { useAuth } from '../../../../../context/AuthContext';
import { fetchAttemptResult } from '../../../../../services/assessmentService';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  XCircle,
  FileText,
} from 'lucide-react';

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const assessmentId = params?.assessmentId;
  const attemptId = params?.attemptId;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadResult = useCallback(async () => {
    if (!attemptId || !accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAttemptResult(attemptId, accessToken);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to load assessment results.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, accessToken]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-2xl mx-auto py-12">
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !result) {
    return (
      <StudentLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Result Unavailable
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'The requested result could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadResult}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link
              href="/assessments"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition"
            >
              Assessments Catalog
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const isPassed = result.passed;
  const minutes = Math.floor((result.timeSpent || 0) / 60);
  const seconds = (result.timeSpent || 0) % 60;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Main Result Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-8 relative overflow-hidden">
          {/* Decorative Background Glow */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
              isPassed ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />

          {/* Icon & Title */}
          <div className="space-y-3 relative z-10">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center shadow-lg ${
                isPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <RotateCcw className="w-10 h-10" />
              )}
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Attempt #{result.attemptNumber} Complete
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {result.assessment?.title || 'Assessment'}
              </h1>
            </div>
          </div>

          {/* Big Score Percentage Display */}
          <div className="relative z-10 space-y-2">
            <div className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
              {result.percentage}%
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {isPassed ? (
                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-4 py-1 rounded-full">
                  Passed • Benchmark Achieved
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-4 py-1 rounded-full">
                  More practice recommended • Passing: {result.assessment?.passingScore}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Score: <strong>{result.score}</strong> marks awarded
            </p>
          </div>

          {/* Granular Breakdown Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-left">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Correct
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.correctAnswers}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Incorrect
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.incorrectAnswers}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Unanswered
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.unanswered}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time Spent
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {minutes}m {seconds}s
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/assessments/${assessmentId}/review/${attemptId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition"
            >
              <FileText className="w-4 h-4" />
              Review Answers & Explanations
            </Link>

            <Link
              href={`/assessments/${assessmentId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-sm font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" />
              Take Another Attempt
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
