'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchStudentDashboard } from '../../services/studentDashboard';

import WelcomeSection from '../../components/dashboard/WelcomeSection';
import QuickActions from '../../components/dashboard/QuickActions';
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard';
import OverallProgressCard from '../../components/dashboard/OverallProgressCard';
import DailyGoalCard from '../../components/dashboard/DailyGoalCard';
import StreakCard from '../../components/dashboard/StreakCard';
import RecommendedLearning from '../../components/dashboard/RecommendedLearning';
import PendingTasksCard from '../../components/dashboard/PendingTasksCard';
import RecentActivityCard from '../../components/dashboard/RecentActivityCard';
import CareerReadinessCard from '../../components/dashboard/CareerReadinessCard';
import RecentAssessmentCard from '../../components/dashboard/RecentAssessmentCard';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await fetchStudentDashboard(accessToken);
      setData(dashboardData);
    } catch (err) {
      setError(err.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Loading State */}
        {loading && <DashboardSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-rose-200 dark:border-rose-900/50 shadow-sm text-center space-y-6 max-w-xl mx-auto my-12">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to load your dashboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && data && (
          <>
            {/* 1. Welcome & Greeting Banner */}
            <WelcomeSection
              student={data.student || user}
              streak={data.streak}
            />

            {/* 2. Quick Action Shortcuts */}
            <QuickActions />

            {/* 3. Main Dashboard Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column (2 spans on desktop) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Continue Learning Primary Card */}
                <ContinueLearningCard course={data.currentCourse} />

                {/* Recommended Next Topics */}
                <RecommendedLearning recommendations={data.recommendations} />

                {/* Career Readiness Radar & Skills */}
                <CareerReadinessCard career={data.career} />

                {/* Recent Activity Timeline */}
                <RecentActivityCard activity={data.recentActivity} />
              </div>

              {/* Right Column (1 span on desktop) */}
              <div className="space-y-8">
                {/* Overall Learning Progress */}
                <OverallProgressCard progress={data.progress} />

                {/* Today's Learning Goals */}
                <DailyGoalCard dailyGoal={data.dailyGoal} />

                {/* Learning Consistency Streak */}
                <StreakCard streak={data.streak} />

                {/* Recent or Active Assessment */}
                <RecentAssessmentCard
                  recentAssessment={data.recentAssessment}
                  inProgressAssessment={data.inProgressAssessment}
                />

                {/* Pending Tasks & Deadlines */}
                <PendingTasksCard tasks={data.pendingTasks} />
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
