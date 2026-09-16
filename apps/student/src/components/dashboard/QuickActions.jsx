'use client';

import Link from 'next/link';
import { BookOpen, Terminal, Sparkles, Cpu, Layers, Briefcase, ArrowRight } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { title: 'Continue Learning', href: '/learning', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/60' },
    { title: 'Practice Coding', href: '/practice', icon: Terminal, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/60' },
    { title: 'Ask AI Tutor', href: '/ai-tutor', icon: Sparkles, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60' },
    { title: 'Mock Interview', href: '/interview', icon: Cpu, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/60' },
    { title: 'Build Project', href: '/projects', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60' },
    { title: 'Explore Jobs', href: '/jobs', icon: Briefcase, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/60' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Action Shortcuts</h3>
        <p className="text-xs text-slate-400">Jump directly into specialized career tools</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 group hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition"
            >
              <div className={`w-10 h-10 rounded-xl ${act.bg} flex items-center justify-center ${act.color} transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
