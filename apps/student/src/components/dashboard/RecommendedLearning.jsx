'use client';

import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, BookOpen, RotateCcw, Target, Code, Check } from 'lucide-react';

export default function RecommendedLearning({ recommendations }) {
  const items = recommendations || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended for You</h3>
            <p className="text-xs text-slate-400">Personalized next steps based on your real activity and curriculum needs</p>
          </div>
        </div>
        <Link href="/daily-plan" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          View Daily Plan →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-3 p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900 dark:text-white">You&apos;re All Caught Up!</div>
            <div className="text-xs text-slate-400 mt-0.5">Explore the catalog or start a new practice problem.</div>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || item._id || idx}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4 group hover:border-purple-300 dark:hover:border-purple-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                    {item.type ? item.type.replace('_', ' ') : (item.topic || 'Recommendation')}
                  </span>
                  {item.priority && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      P{item.priority}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
                  {item.title}
                </h4>

                {item.reason && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                    Why: {item.reason}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.estimatedTime ? `${item.estimatedTime}m` : '15m'}</span>
                </div>
                <Link
                  href={item.href || (item.slug ? `/courses/${item.slug}` : '/learning')}
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Start <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
