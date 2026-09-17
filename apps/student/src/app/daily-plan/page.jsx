'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyPlan, generateDailyPlan, toggleDailyTask } from '../../services/intelligenceService';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Target,
  AlertCircle
} from 'lucide-react';

export default function DailyPlanPage() {
  const { user, accessToken } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const loadPlan = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyPlan(accessToken);
      setPlan(data);
    } catch (err) {
      setError(err.message || 'Failed to load your daily plan.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleToggle = async (taskId, currentStatus) => {
    try {
      const updated = await toggleDailyTask(accessToken, taskId, !currentStatus);
      setPlan(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const regenerated = await generateDailyPlan(accessToken, { availableMinutes: 60 });
      setPlan(regenerated);
    } catch (err) {
      setError(err.message || 'Failed to regenerate study plan.');
    } finally {
      setGenerating(false);
    }
  };

  const completedCount = plan?.tasks?.filter((t) => t.isCompleted).length || 0;
  const totalCount = plan?.tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today&apos;s Learning Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Daily Study Plan
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Realistic, personalized tasks derived from your active curriculum and practice needs.
            </p>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={generating || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Optimizing...' : 'Regenerate Plan'}</span>
          </button>
        </div>

        {/* Progress Overview Card */}
        {plan && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Duration</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>{plan.estimatedDuration || 60} mins</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Completion</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{completedCount} of {totalCount} tasks</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Today&apos;s Progress</div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {progressPercent}%
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading today&apos;s study plan...</div>
        ) : error ? (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {plan?.tasks?.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">You&apos;re All Caught Up!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  No pending tasks for today. Click &quot;Regenerate Plan&quot; to schedule additional practice.
                </p>
              </div>
            ) : (
              plan?.tasks?.map((task, idx) => (
                <div
                  key={task.id || idx}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggle(task.id, task.isCompleted)}
                      className="mt-0.5 text-slate-400 hover:text-brand-600 transition"
                      aria-label="Toggle task completion"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-400 hover:text-brand-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {task.category || 'Practice'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes} min
                        </span>
                      </div>

                      <h4
                        className={`text-base font-semibold mt-1.5 ${
                          task.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.why && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{task.why}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {task.href && (
                    <Link
                      href={task.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shrink-0 self-end sm:self-auto"
                    >
                      <span>Start Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Transparency note */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            Daily plans adapt to your current course velocity, weak topics, and active goals. No unverified lessons are ever scheduled.
          </span>
        </div>
      </div>
    </StudentLayout>
  );
}
