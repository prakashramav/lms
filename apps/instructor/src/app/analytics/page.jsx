'use client';

import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchOverviewAnalytics } from '../../services/instructorService';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  RotateCw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetchOverviewAnalytics(accessToken);
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
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

  const performance = data?.coursePerformance || [];

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Curriculum Telemetry &amp; Analytics
            </h1>
            <p className="text-sm text-slate-400">
              Real-time student progress, drop-off rates, and automated assessment scoring
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
            title="Refresh Analytics"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs uppercase text-slate-400 font-bold">Total Enrollments</span>
            <p className="text-3xl font-extrabold text-white">{metrics.totalEnrollments}</p>
            <p className="text-[11px] text-slate-500">Across {metrics.totalCourses} courses</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs uppercase text-slate-400 font-bold">Active Students</span>
            <p className="text-3xl font-extrabold text-teal-400">{metrics.totalStudents}</p>
            <p className="text-[11px] text-slate-500">Distinct learner profiles</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs uppercase text-slate-400 font-bold">Cohort Completion</span>
            <p className="text-3xl font-extrabold text-emerald-400">{metrics.averageCompletion}%</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, metrics.averageCompletion)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs uppercase text-slate-400 font-bold">Avg Assessment Score</span>
            <p className="text-3xl font-extrabold text-amber-400">{metrics.averageAssessmentScore}%</p>
            <p className="text-[11px] text-slate-500">Auto-evaluated quizzes</p>
          </div>
        </div>

        {/* COURSE BREAKDOWN */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <span>Course-by-Course Performance Breakdown</span>
          </h3>

          {performance.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Analytics will appear once students enroll and begin learning.
            </div>
          ) : (
            <div className="space-y-3">
              {performance.map((c) => (
                <div
                  key={c.courseId}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{c.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{c.modulesCount} Modules</span>
                      <span>•</span>
                      <span>{c.lessonsCount} Lessons</span>
                      <span>•</span>
                      <span className="text-teal-400 font-medium">
                        {c.enrolledStudents} Enrolled
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Completion Rate</span>
                      <span className="text-lg font-extrabold text-white">
                        {c.averageCompletion}%
                      </span>
                    </div>
                    <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, c.averageCompletion)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
