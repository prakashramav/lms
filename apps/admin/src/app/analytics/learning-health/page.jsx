'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import {
  Brain,
  Activity,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
  Loader2,
  AlertCircle,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Flame
} from 'lucide-react';

export default function PlatformLearningHealthPage() {
  const [health, setHealth] = useState(null);
  const [recAnalytics, setRecAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [hRes, rRes] = await Promise.all([
          adminApi.getLearningHealth(),
          adminApi.getRecommendationAnalytics(),
        ]);
        setHealth(hRes.data || {});
        setRecAnalytics(rRes.data || {});
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch platform learning health metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Aggregating platform learning health telemetry...</p>
        </div>
      </AdminLayout>
    );
  }

  const active = health?.activeLearners || { monthly: 0, weekly: 0 };
  const courseHealth = health?.courseHealth || { totalEnrollments: 0, completedEnrollments: 0, completionRate: '0%' };
  const actSummary = health?.activitySummary || { lessonsCompleted: 0, quizzesSubmitted: 0, codingSolved: 0 };
  const recommendations = health?.recommendations || { totalGenerated: 0, viewed: 0, completed: 0, conversionRate: '0%' };
  const goals = health?.goals || { total: 0, completed: 0, successRate: '0%' };
  const commonStruggles = health?.commonStrugglingTopics || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-semibold mb-2">
              <Brain className="w-3.5 h-3.5" />
              <span>Phase 11: Learning Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Learning Health</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cluster-wide learning health, curriculum drop-off telemetry, and recommendation engagement.
            </p>
          </div>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <span>Platform Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Monthly Active Learners</span>
            <div className="text-2xl font-bold text-white mt-1">
              {active.monthly}
            </div>
            <div className="text-[11px] text-slate-500">
              {active.weekly} active in last 7 days
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Course Completion Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {courseHealth.completionRate}
            </div>
            <div className="text-[11px] text-slate-500">
              {courseHealth.completedEnrollments} of {courseHealth.totalEnrollments} enrollments
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Rec. Conversion Rate</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {recommendations.conversionRate}
            </div>
            <div className="text-[11px] text-slate-500">
              {recommendations.completed} completed of {recommendations.totalGenerated}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Goal Success Rate</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {goals.successRate}
            </div>
            <div className="text-[11px] text-slate-500">
              {goals.completed} of {goals.total} student goals completed
            </div>
          </div>
        </div>

        {/* Activity Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Platform Activity Breakdown</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Lessons Completed</span>
                <div className="text-xl font-bold text-white mt-0.5">{actSummary.lessonsCompleted}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 flex items-center justify-center text-blue-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Quizzes Evaluated</span>
                <div className="text-xl font-bold text-white mt-0.5">{actSummary.quizzesSubmitted}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 flex items-center justify-center text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Coding Challenges Solved</span>
                <div className="text-xl font-bold text-white mt-0.5">{actSummary.codingSolved}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Common Struggling Topics across Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Platform-Wide Weak Topics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated topics where learners need the most practice across courses.
            </p>

            {commonStruggles.length === 0 ? (
              <p className="text-xs text-slate-500">No common weak topics detected across cohorts.</p>
            ) : (
              <div className="space-y-2.5">
                {commonStruggles.map((item) => (
                  <div
                    key={item.topic}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{item.topic}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold">
                      {item.studentCount} students struggling
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation Telemetry & Feedback Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Recommendation Feedback Signals</span>
            </h3>
            <p className="text-xs text-slate-400">
              Direct student feedback on recommendation quality and relevance.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-1">
                <ThumbsUp className="w-4 h-4 text-emerald-400 mx-auto" />
                <div className="text-lg font-bold text-emerald-300">
                  {recAnalytics?.feedback?.helpful || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-500">Helpful</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-center space-y-1">
                <ThumbsDown className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-lg font-bold text-amber-300">
                  {recAnalytics?.feedback?.notHelpful || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-amber-500">Not Helpful</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center space-y-1">
                <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                <div className="text-lg font-bold text-rose-300">
                  {recAnalytics?.feedback?.notRelevant || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-rose-500">Not Relevant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
