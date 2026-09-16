'use client';

import { CheckCircle, Circle, Target } from 'lucide-react';

export default function DailyGoalCard({ dailyGoal }) {
  const completed = dailyGoal?.completed || 0;
  const total = dailyGoal?.total || 5;
  const tasks = dailyGoal?.tasks || [];
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Today&apos;s Goal</h3>
            <p className="text-xs text-slate-400">Daily learning objectives</p>
          </div>
        </div>
        <span className="text-sm font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
          {completed} / {total}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 block text-right font-medium">
          {percentage}% Complete
        </span>
      </div>

      <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-700/50">
        {tasks.map((task) => (
          <div key={task.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              {task.completed ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
              <span
                className={`truncate ${
                  task.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-200 font-medium'
                }`}
              >
                {task.title}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0">
              {task.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
