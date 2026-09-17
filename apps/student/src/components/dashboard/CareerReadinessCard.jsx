'use client';

import { Compass, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CareerReadinessCard({ career }) {
  const targetRole = career?.targetRole || 'Full Stack Software Engineer';
  const skills = career?.skills || [];
  const readiness = career?.overallReadiness || 72;

  const getProficiencyStyle = (prof) => {
    switch (prof) {
      case 'STRONG':
        return { label: 'Strong', badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'GOOD':
        return { label: 'Good', badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'DEVELOPING':
        return { label: 'Developing', badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      default:
        return { label: 'Needs Practice', badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Career Readiness Profile</h3>
            <p className="text-xs text-slate-400">Target Role: <strong className="text-slate-800 dark:text-slate-200">{targetRole}</strong></p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{readiness}%</span>
          <span className="text-xs text-slate-400 block">Overall Fit Index</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {skills.map((skill) => {
          const prof = getProficiencyStyle(skill.proficiency);
          return (
            <div key={skill.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{skill.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prof.badge}`}>
                  {prof.label}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${skill.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="hover:text-brand-500 transition-colors">
            Job Board
          </Link>
          <span>•</span>
          <Link href="/applications" className="hover:text-brand-500 transition-colors">
            Applications
          </Link>
          <span>•</span>
          <Link href="/resume" className="hover:text-brand-500 transition-colors">
            Resume
          </Link>
          <span>•</span>
          <Link href="/interview-prep" className="hover:text-brand-500 transition-colors">
            Interview Prep
          </Link>
        </div>
        <Link href="/career" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          Career Hub &amp; Skill Gap Analysis →
        </Link>
      </div>
    </div>
  );
}

