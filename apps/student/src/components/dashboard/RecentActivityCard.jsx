'use client';

import { Activity, CheckCircle2, Play, Trophy, Code2 } from 'lucide-react';

export default function RecentActivityCard({ activity }) {
  const items = activity || [];

  const getActionIcon = (action) => {
    switch (action) {
      case 'PASSED_PROBLEM':
        return <Code2 className="w-4 h-4 text-brand-600" />;
      case 'COMPLETED_QUIZ':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'STARTED_COURSE':
        return <Play className="w-4 h-4 text-indigo-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-400">Your latest platform milestones</p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
        {items.map((item) => (
          <div key={item.id} className="relative flex items-start gap-3 text-xs sm:text-sm">
            <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-brand-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{item.action.replace('_', ' ')}</span>
                {item.score && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">{item.score}</span>
                  </>
                )}
                <span>•</span>
                <span>{formatTime(item.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
