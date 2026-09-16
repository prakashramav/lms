'use client';

import { useState } from 'react';
import { Lightbulb, ChevronRight, Lock, CheckCircle2, Sparkles } from 'lucide-react';

const TIERS = [
  { level: 1, name: 'Conceptual' },
  { level: 2, name: 'Approach' },
  { level: 3, name: 'Pseudocode' },
  { level: 4, name: 'Direct Guidance' },
];

export default function AIHintCard({ problemId, onFetchHint, currentTier = 1, hintText, loading }) {
  const [activeTier, setActiveTier] = useState(currentTier);

  const handleNext = () => {
    if (activeTier < 4) {
      const nextTier = activeTier + 1;
      setActiveTier(nextTier);
      onFetchHint?.(nextTier);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 p-4 sm:p-5 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-950 pb-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Lightbulb className="w-5 h-5" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            AI Pedagogical Hint
          </h3>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
          Tier {activeTier} of 4
        </span>
      </div>

      {/* 4-Tier Step Indicator */}
      <div className="grid grid-cols-4 gap-2">
        {TIERS.map((t) => {
          const isUnlocked = t.level <= activeTier;
          const isCurrent = t.level === activeTier;
          return (
            <div
              key={t.level}
              className={`p-2 rounded-xl text-center border transition-all ${
                isCurrent
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-700 dark:text-amber-300 font-bold'
                  : isUnlocked
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  : 'opacity-50 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px]">
                {isUnlocked ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3" />}
                <span className="truncate">{t.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint Content */}
      <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed min-h-[80px]">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Consulting AI Tutor for Tier {activeTier}...</span>
          </div>
        ) : (
          <div className="whitespace-pre-line">{hintText || 'Click "Get Hint" to reveal conceptual guidance without spoiling the solution.'}</div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-slate-400">
          Try to solve the problem before unlocking the next hint.
        </p>

        {activeTier < 4 && (
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-all shadow-xs"
          >
            <span>Unlock Next Hint</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
