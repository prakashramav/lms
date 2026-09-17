'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchOverviewAnalytics } from '../../services/instructorService';
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  ChevronRight,
  Code2,
  FileQuestion,
  AlertCircle,
  Play,
  RotateCw,
} from 'lucide-react';

export default function InstructorDashboardPage() {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchOverviewAnalytics(accessToken);
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err.message || 'Unable to load instructor analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [accessToken]);

  const metrics = data?.metrics || {
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    averageCompletion: 0,
    averageAssessmentScore: 0,
  };

  return (
    <InstructorLayout>
      <div className="space-y-8">
        {/* WELCOME SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-900 border border-teal-800/30 p-6 sm:p-8">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Instructor Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'Professor'}
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Monitor student cohorts, author modular lessons with embedded coding sandboxes, and inspect live course telemetry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadDashboard}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition"
                title="Refresh metrics"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
              </button>
              <Link
                href="/courses/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/25 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboard}
              className="text-xs font-semibold underline hover:text-rose-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* OVERVIEW KPI METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Total Courses</span>
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isLoading ? '...' : metrics.totalCourses}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-teal-400 font-semibold">{metrics.publishedCourses} Published</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{metrics.draftCourses} Drafts</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Active Students</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isLoading ? '...' : metrics.totalStudents}
            </p>
            <p className="text-xs text-slate-400">
              Across <span className="text-sky-400 font-medium">{metrics.totalEnrollments} enrollments</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Avg. Completion</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isLoading ? '...' : `${metrics.averageCompletion}%`}
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.averageCompletion)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Avg. Quiz Score</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {isLoading ? '...' : `${metrics.averageAssessmentScore}%`}
            </p>
            <p className="text-xs text-slate-400">Automated evaluation average</p>
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Authoring Toolbelt</h3>
              <p className="text-xs text-slate-400">Jump directly into content creation or grading</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/courses/new"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>New Course</span>
            </Link>
            <Link
              href="/assessments"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileQuestion className="w-3.5 h-3.5 text-amber-400" />
              <span>Question Bank</span>
            </Link>
            <Link
              href="/practice"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Coding Problem</span>
            </Link>
            <Link
              href="/students"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Students</span>
            </Link>
          </div>
        </div>

        {/* TWO COLUMN SECTION: COURSE PERFORMANCE & RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COURSE PERFORMANCE LIST (2 COLUMNS) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Course Performance</h2>
                <p className="text-xs text-slate-400">Enrollment and completion breakdown for your courses</p>
              </div>
              <Link
                href="/courses"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
                ))}
              </div>
            ) : !data?.coursePerformance || data.coursePerformance.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">No courses authored yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Get started by creating your first course with structured modules and hands-on coding.
                </p>
                <Link
                  href="/courses/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Course
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.coursePerformance.map((course) => (
                  <div
                    key={course.courseId}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            course.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {course.status}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">{course.title}</h4>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{course.modulesCount || 0} Modules</span>
                        <span>•</span>
                        <span>{course.lessonsCount || 0} Lessons</span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">
                          {course.enrolledStudents || 0} Enrolled
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Avg. Completion</div>
                        <div className="text-base font-extrabold text-white">
                          {course.averageCompletion || 0}%
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.courseId}/edit`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
                      >
                        <span>Studio</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY LOGS (1 COLUMN) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-400">Platform and cohort event feed</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 rounded-xl bg-slate-800/60 animate-pulse" />
                  ))}
                </div>
              ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No recent activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((log, idx) => (
                    <div
                      key={log._id || idx}
                      className="flex items-start gap-3 text-xs pb-3 border-b border-slate-800/80 last:border-0 last:pb-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium">
                          {log.action?.replace(/_/g, ' ') || 'Course action'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {log.resourceType || 'Resource'} • {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
