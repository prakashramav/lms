'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../../../components/layout/StudentLayout';
import { useAuth } from '../../../../../context/AuthContext';
import { fetchAttemptReview } from '../../../../../services/assessmentService';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Lightbulb,
  Award,
} from 'lucide-react';

export default function AssessmentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const assessmentId = params?.assessmentId;
  const attemptId = params?.attemptId;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReview = useCallback(async () => {
    if (!attemptId || !accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAttemptReview(attemptId, accessToken);
      setReview(data);
    } catch (err) {
      setError(err.message || 'Unable to load assessment review.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, accessToken]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !review) {
    return (
      <StudentLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Review Unavailable
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'The requested review is not available.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadReview}
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

  const questions = review.questions || [];
  const attempt = review.attempt || {};
  const assessment = review.assessment || {};

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Navigation & Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/assessments/${assessmentId}/results/${attemptId}`}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition"
              title="Back to Result Summary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Question Review & Solutions
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {assessment.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl">
              Score: {attempt.score} pts ({attempt.percentage}%)
            </span>
            <span
              className={`font-bold px-3 py-1.5 rounded-xl ${
                attempt.passed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
              }`}
            >
              {attempt.passed ? 'PASSED' : 'NOT PASSED'}
            </span>
          </div>
        </div>

        {/* Questions Detailed List */}
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const studentAnswers = q.studentAnswers || [];
            const correctAnswers = q.correctAnswers || [];

            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6 ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                {/* Question Header: Number + Result Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      Question {idx + 1}
                    </span>
                    <span className="text-xs text-slate-400">
                      {q.marksAwarded} / {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isCorrect ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct (+{q.marksAwarded})
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrect (0 marks)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {q.question}
                </h3>

                {/* Options List with Visual State Highlighting */}
                <div className="space-y-3">
                  {(q.options || []).map((opt) => {
                    const isSelectedByStudent = studentAnswers.includes(opt.id);
                    const isCorrectOption = correctAnswers.includes(opt.id);

                    let optionBorder = 'border-slate-200 dark:border-slate-700';
                    let optionBg = 'bg-slate-50/50 dark:bg-slate-900/40';

                    if (isCorrectOption) {
                      optionBorder = 'border-emerald-500 dark:border-emerald-600';
                      optionBg = 'bg-emerald-50/60 dark:bg-emerald-950/40';
                    } else if (isSelectedByStudent && !isCorrectOption) {
                      optionBorder = 'border-rose-500 dark:border-rose-600';
                      optionBg = 'bg-rose-50/60 dark:bg-rose-950/40';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${optionBorder} ${optionBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg font-mono text-xs font-bold uppercase flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {opt.id}
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {opt.text}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSelectedByStudent && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isCorrectOption
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              Your Answer
                            </span>
                          )}
                          {isCorrectOption && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                              Correct Key
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {q.explanation && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                      <Lightbulb className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      Explanation
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href={`/assessments/${assessmentId}/results/${attemptId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs sm:text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Score Report
          </Link>

          <Link
            href="/assessments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
          >
            All Assessments
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
