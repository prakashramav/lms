'use client';

import { Flame, Check, Circle } from 'lucide-react';

export default function StreakCard({ streak }) {
  const days = streak?.currentDays || 0;
  const best = streak?.bestDays || 0;
  const weekly = streak?.weeklyActivity || [
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
    { day: 'Wed', active: true },
    { day: 'Thu', active: true },
    { day: 'Fri', active: true },
    { day: 'Sat', active: false },
    { day: 'Sun', active: false },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-500">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Consistency Streak</h3>
            <p className="text-xs text-slate-400">Past 7 days active momentum</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold text-amber-500">{days} Days</span>
          <p className="text-[10px] text-slate-400">Best: {best}d</p>
        </div>
      </div>

      {/* Weekly Activity Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1">
        {weekly.map((item) => (
          <div key={item.day} className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {item.day}
            </span>
            <div
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-300 dark:text-slate-600'
              }`}
            >
              {item.active ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Circle className="w-2 h-2 fill-current" />}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
        You are in the top <strong className="text-slate-800 dark:text-slate-200">15%</strong> of active learners this week!
      </div>
    </div>
  );
}
