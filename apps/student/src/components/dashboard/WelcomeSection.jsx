'use client';

import Link from 'next/link';
import { Sparkles, Compass, Flame, ArrowRight } from 'lucide-react';

export default function WelcomeSection({ student, streak }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const name = student?.name || 'Student';
  const targetRole = student?.targetRole;

  return (
    <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-3 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Career Advancement Engine
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          {getGreeting()}, {name}
        </h1>

        <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
          Continue building your skills and move one step closer to your career goals.
        </p>

        {targetRole ? (
          <div className="flex items-center gap-2 pt-1 text-xs sm:text-sm text-white/90">
            <Compass className="w-4 h-4 text-brand-200" />
            <span>Target Role: <strong className="text-white">{targetRole}</strong></span>
          </div>
        ) : (
          <Link
            href="/career"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white underline pt-1"
          >
            Set your target career goal →
          </Link>
        )}
      </div>

      {streak && (
        <div className="z-10 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 flex items-center gap-4 flex-shrink-0 self-stretch md:self-auto justify-between md:justify-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/70 font-bold">Active Streak</div>
            <div className="text-2xl font-extrabold text-white">{streak.currentDays} Days</div>
            <div className="text-[11px] text-emerald-300 font-medium">Keep it going today!</div>
          </div>
        </div>
      )}
    </div>
  );
}
