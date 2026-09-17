'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchWeeklyReview } from '../../services/intelligenceService';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Code,
  CheckSquare,
  Flame,
  AlertCircle
} from 'lucide-react';

export default function WeeklyReviewPage() {
  const { accessToken } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReview = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeeklyReview(accessToken);
      setReview(data);
    } catch (err) {
      setError(err.message || 'Failed to load your weekly review.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const curr = review?.currentWeek || { lessonsCompleted: 0, codingProblemsSolved: 0, quizzesTaken: 0, estimatedStudyMinutes: 0 };
  const prev = review?.previousWeek || { lessonsCompleted: 0, codingProblemsSolved: 0, quizzesTaken: 0, estimatedStudyMinutes: 0 };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Learning Synthesis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Weekly Performance Review
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Factual summary of your learning velocity, completed modules, and targeted revision advice.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold text-sm shrink-0">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>{review?.streakDays || 0} Day Streak</span>
          </div>
        </div>

        {/* AI Grounded Narrative Banner */}
        {review?.aiSummary && (
          <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 rounded-3xl p-6 sm:p-8 border border-purple-200 dark:border-purple-800/60 space-y-3">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Learning Intelligence Digest</span>
            </div>
            <p className="text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              &ldquo;{review.aiSummary}&rdquo;
            </p>
            <div className="text-xs text-slate-400">
              Period: {review.period?.start} to {review.period?.end}
            </div>
          </div>
        )}

        {/* Core Metric Cards with Prior-Week Deltas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Lessons</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {curr.lessonsCompleted}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              vs {prev.lessonsCompleted} last week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Coding</span>
              <Code className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {curr.codingProblemsSolved}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              vs {prev.codingProblemsSolved} last week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Quizzes</span>
              <CheckSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {curr.quizzesTaken}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              vs {prev.quizzesTaken} last week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Time</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {curr.estimatedStudyMinutes}m
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              vs {prev.estimatedStudyMinutes}m last week
            </div>
          </div>
        </div>

        {/* Practiced & Weak Topics Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Practiced Topics</span>
            </h3>
            {review?.practicedTopics?.length === 0 ? (
              <p className="text-xs text-slate-400">No specific topics tagged this week yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {review?.practicedTopics?.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Recommended Focus</span>
            </h3>
            {review?.weakTopicsToReview?.length === 0 ? (
              <p className="text-xs text-slate-400">No weak topics identified this week! Keep up the great pace.</p>
            ) : (
              <div className="space-y-2">
                {review?.weakTopicsToReview?.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50"
                  >
                    <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                      {topic}
                    </span>
                    <Link
                      href={`/revision`}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <Link
            href="/daily-plan"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition"
          >
            <span>Proceed to Today&apos;s Learning Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
