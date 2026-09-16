'use client';

import React from 'react';
import { Flame, CheckCircle, Code, Award } from 'lucide-react';

export default function PracticeStatsCard({ stats }) {
  if (!stats) return null;

  const { solvedCount = 0, attemptedCount = 0, codingStreak = 0, difficulty = {}, topics = {} } = stats;

  const easySolved = difficulty?.easy?.solved || 0;
  const easyTotal = difficulty?.easy?.total || 0;
  const medSolved = difficulty?.medium?.solved || 0;
  const medTotal = difficulty?.medium?.total || 0;
  const hardSolved = difficulty?.hard?.solved || 0;
  const hardTotal = difficulty?.hard?.total || 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{codingStreak}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Day Streak</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{solvedCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Solved</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{attemptedCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Attempted</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalProblems || 30}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Problems</div>
          </div>
        </div>
      </div>

      {/* Difficulty Progress Bars */}
      <div className="pt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Difficulty Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Easy */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-emerald-600 dark:text-emerald-400">Easy</span>
              <span className="text-slate-600 dark:text-slate-400">
                {easySolved} / {easyTotal}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${easyTotal > 0 ? (easySolved / easyTotal) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-amber-600 dark:text-amber-400">Medium</span>
              <span className="text-slate-600 dark:text-slate-400">
                {medSolved} / {medTotal}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${medTotal > 0 ? (medSolved / medTotal) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-rose-600 dark:text-rose-400">Hard</span>
              <span className="text-slate-600 dark:text-slate-400">
                {hardSolved} / {hardTotal}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${hardTotal > 0 ? (hardSolved / hardTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
