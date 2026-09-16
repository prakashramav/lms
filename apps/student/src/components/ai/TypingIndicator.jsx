'use client';

import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 my-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>

      <div className="rounded-2xl px-4 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-tl-sm shadow-sm flex items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
          AI is thinking
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
