'use client';

import Link from 'next/link';
import { Award, CheckCircle2, PlayCircle, ArrowRight, RotateCcw } from 'lucide-react';

export default function RecentAssessmentCard({ recentAssessment, inProgressAssessment }) {
  // If student has an active assessment in progress, prioritize showing it
  if (inProgressAssessment) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            In Progress
          </span>
          <span className="text-xs text-slate-400">
            {inProgressAssessment.duration}m Limit
          </span>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {inProgressAssessment.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You have an active attempt running. Resume to complete before the timer expires.
          </p>
        </div>

        <Link
          href={`/assessments/${inProgressAssessment.id}/play`}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition"
        >
          <PlayCircle className="w-4 h-4" />
          Resume Assessment
        </Link>
      </div>
    );
  }

  // If student has completed an assessment recently
  if (recentAssessment) {
    const isPassed = recentAssessment.passed;
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            Recent Assessment
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
              isPassed
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
            }`}
          >
            {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            {recentAssessment.percentage}% {isPassed ? 'Passed' : 'Completed'}
          </span>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {recentAssessment.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Score: {recentAssessment.score} points • Evaluated server-side
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/assessments/${recentAssessment.id}/results/${recentAssessment.attemptId}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold transition"
          >
            View Results
          </Link>
          <Link
            href={`/assessments/${recentAssessment.id}/review/${recentAssessment.attemptId}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
          >
            Review Answers <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Default empty state
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3">
      <div className="w-10 h-10 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
        <Award className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Skill Assessments</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Validate your competencies with timed curriculum quizzes.
        </p>
      </div>
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
      >
        Browse Assessments <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
