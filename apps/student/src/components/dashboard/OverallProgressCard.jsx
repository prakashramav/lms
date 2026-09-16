'use client';

import { Award, BookCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function OverallProgressCard({ progress }) {
  const percentage = progress?.overallPercentage || 0;
  const completed = progress?.completedLessons || 0;
  const total = progress?.totalLessons || 0;
  const pendingAssignments = progress?.pendingAssignments || 0;
  const hours = progress?.hoursLearned || 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Overall Progress
        </h3>
        <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-600 to-indigo-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <BookCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Lessons</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {completed}/{total}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Time</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {hours}h
          </p>
          <span className="text-[10px] text-slate-400">Focused Study</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {pendingAssignments}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">Assignments</span>
        </div>
      </div>
    </div>
  );
}
