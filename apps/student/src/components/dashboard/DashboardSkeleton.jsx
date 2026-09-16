'use client';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800" />

      {/* Primary Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning Skeleton */}
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          {/* Recommendations Skeleton */}
          <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          {/* Career Readiness Skeleton */}
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="space-y-8">
          {/* Progress Skeleton */}
          <div className="h-52 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          {/* Daily Goal Skeleton */}
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          {/* Streak Skeleton */}
          <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          {/* Pending Tasks Skeleton */}
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
