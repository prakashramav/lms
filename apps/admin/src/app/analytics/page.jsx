'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  BarChart3,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  PieChart,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function PlatformAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [learningAnalytics, setLearningAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [oRes, uRes, cRes, lRes] = await Promise.all([
          adminApi.getAnalyticsOverview(),
          adminApi.getUserAnalytics(),
          adminApi.getCourseAnalytics(),
          adminApi.getLearningAnalytics(),
        ]);
        setOverview(oRes.data?.kpis || {});
        setUserAnalytics(uRes.data || {});
        setCourseAnalytics(cRes.data || {});
        setLearningAnalytics(lRes.data || {});
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err.message || 'Failed to fetch platform analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Aggregating platform intelligence across clusters...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Analytics & Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate performance metrics across users, curriculum enrollments, and academic achievements
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Total Enrolled Learners</span>
            <p className="text-2xl font-bold text-white mt-1">{overview?.totalStudents ?? 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Total Course Enrollments</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{overview?.totalEnrollments ?? 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Platform Completion Rate</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{overview?.completionRate ?? 0}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Avg Assessment Score</span>
            <p className="text-2xl font-bold text-violet-400 mt-1">{learningAnalytics?.averageAssessmentScore ?? 0}%</p>
          </div>
        </div>

        {/* 2-Column: User Demographics & Learning Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Platform Tenant Distribution by Role</h2>
            </div>

            <div className="space-y-3 pt-2">
              {userAnalytics?.roleDistribution?.map((r) => (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{r.role}</span>
                    <span className="text-slate-400 font-bold">{r.count} users</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(5, (r.count / (overview?.totalStudents + overview?.totalInstructors + 2 || 1)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Enrolled Courses */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Top Enrolled Courses</h2>
            </div>

            {courseAnalytics?.topEnrolled?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No enrollment data recorded yet.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {courseAnalytics?.topEnrolled?.map((c) => (
                  <div key={c._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{c.title}</p>
                      <p className="text-[11px] text-slate-500">{c.category}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {c.enrollmentsCount} enrollments
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Curriculum Distribution by Category</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {courseAnalytics?.categoryDistribution?.map((cat) => (
              <div key={cat.category} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center">
                <span className="text-xs font-medium text-slate-300 block truncate">{cat.category}</span>
                <p className="text-lg font-bold text-indigo-400 mt-1">{cat.count}</p>
                <span className="text-[10px] text-slate-500">courses</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
