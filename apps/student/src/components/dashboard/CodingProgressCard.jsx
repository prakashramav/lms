'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, ArrowRight, CheckCircle2, Flame, Award } from 'lucide-react';

export default function CodingProgressCard({ data }) {
  const codingProgress = data?.codingProgress || {};
  const streak = data?.streak?.currentStreak || 0;
  const solvedCount = codingProgress.solvedCount || 0;
  const totalProblems = codingProgress.totalProblems || 30;
  const recentSubmission = codingProgress.recentSubmission;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Coding Practice</h3>
            <p className="text-[11px] text-slate-500">Interactive Online Judge</p>
          </div>
        </div>

        <Link
          href="/practice"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group"
        >
          Catalog
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Metric badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Solved</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {solvedCount} <span className="text-xs font-normal text-slate-400">/ {totalProblems}</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Coding Streak</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {streak} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Problem Completion</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${totalProblems > 0 ? (solvedCount / totalProblems) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Recent Submission Banner */}
      {recentSubmission && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between text-xs">
          <div>
            <div className="text-[11px] text-slate-400">Recent Attempt:</div>
            <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
              {recentSubmission.problemTitle}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              recentSubmission.verdict === 'ACCEPTED'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {recentSubmission.verdict}
          </span>
        </div>
      )}

      <Link
        href="/practice"
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
      >
        <span>Continue Practice</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
