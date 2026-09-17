'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  CheckCircle,
  Clock,
  Activity,
  Layers,
  Award,
  Code,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, pendingRes, auditRes] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getPendingCourses({ limit: 5 }),
        adminApi.getAuditLogs({ limit: 6 }),
      ]);

      setData(overviewRes.data?.kpis || {});
      setPendingCourses(pendingRes.data?.courses || []);
      setAuditLogs(auditRes.data?.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to fetch platform metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpiCards = [
    { label: 'Total Students', value: data?.totalStudents ?? 0, icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Total Instructors', value: data?.totalInstructors ?? 0, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Courses', value: data?.totalCourses ?? 0, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Published Courses', value: data?.publishedCourses ?? 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Approvals', value: data?.pendingApprovals ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Enrollments', value: data?.totalEnrollments ?? 0, icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Active Users', value: data?.activeUsers ?? 0, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Completion Rate', value: `${data?.completionRate ?? 0}%`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Assessment Attempts', value: data?.totalAssessmentAttempts ?? 0, icon: Award, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Coding Submissions', value: data?.totalSubmissions ?? 0, icon: Code, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'AI Messages Processed', value: data?.aiRequests ?? 0, icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header with Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Operational Overview</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time telemetry and administrative controls across all tenants</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Metrics</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 11 KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                  <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {isLoading ? '...' : kpi.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column: Pending Approvals & Recent Audit Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Course Approvals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Courses Awaiting Approval</h2>
              </div>
              <a href="/courses/pending" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                <span>View Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {pendingCourses.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Approval queue is clear! No courses pending review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCourses.map((c) => (
                  <div
                    key={c._id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Instructor: {c.instructor?.name || 'Assigned Staff'} • {c.category}
                      </p>
                    </div>
                    <a
                      href={`/courses/${c._id}/review`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shrink-0"
                    >
                      Review
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Events */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Administrative Activity Trail</h2>
              </div>
              <a href="/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                <span>All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent administrative events recorded.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {log.resourceType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        By {log.actorId?.name || 'System Admin'} ({log.actorRole})
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
