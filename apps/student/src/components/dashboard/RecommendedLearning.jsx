'use client';

import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, BarChart } from 'lucide-react';

export default function RecommendedLearning({ recommendations }) {
  const items = recommendations || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended Learning</h3>
            <p className="text-xs text-slate-400">Curated next steps based on your progress</p>
          </div>
        </div>
        <Link href="/learning" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3 group hover:border-brand-300 dark:hover:border-brand-700 transition"
          >
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {item.topic}
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                {item.title}
              </h4>
            </div>

            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.estimatedTime}</span>
              </div>
              <Link
                href="/learning"
                className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Start <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
