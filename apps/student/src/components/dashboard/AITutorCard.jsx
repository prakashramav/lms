'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';

export default function AITutorCard({ aiTutorInsight }) {
  const recommendedTopic = aiTutorInsight?.recommendedTopic || 'Modern JavaScript Fundamentals';
  const prompt = aiTutorInsight?.prompt || 'Ask AI Tutor to create a personalized study plan';

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-900/10 via-slate-900/40 to-indigo-950/20 dark:from-violet-950/30 dark:via-slate-900/80 dark:to-indigo-950/40 border border-violet-200/60 dark:border-violet-800/40 shadow-sm relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Technical Mentor</span>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
            Active RAG
          </span>
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Personalized Learning Recommendation
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {prompt}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">Focus: <strong className="font-semibold">{recommendedTopic}</strong></span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/ai-tutor"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition shadow-xs"
          >
            <span>Ask AI Tutor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
