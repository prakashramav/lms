'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import StudentLayout from '../layout/StudentLayout';

export default function PlaceholderPage({
  title,
  subtitle,
  icon: Icon = Sparkles,
  phaseNumber = 'Upcoming Phase',
  features = [],
}) {
  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/dashboard" className="hover:text-brand-600 transition">
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Icon className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{phaseNumber} Implementation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">{subtitle}</p>
          </div>

          {features.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 max-w-lg mx-auto text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Core Capabilities in this Module
              </p>
              <div className="space-y-2">
                {features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-600/20 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
