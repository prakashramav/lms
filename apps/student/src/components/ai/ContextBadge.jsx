'use client';

import { BookOpen, Terminal, Award, X } from 'lucide-react';

export default function ContextBadge({ context, onClearContext }) {
  if (!context || (!context.courseTitle && !context.lessonTitle && !context.problemTitle)) {
    return null;
  }

  let label = '';
  let Icon = BookOpen;

  if (context.problemTitle) {
    Icon = Terminal;
    label = `Coding Problem: ${context.problemTitle} (${context.difficulty || 'Practice'})`;
  } else if (context.lessonTitle) {
    Icon = BookOpen;
    label = `Lesson: ${context.lessonTitle} (${context.courseTitle || 'Curriculum'})`;
  } else if (context.courseTitle) {
    Icon = BookOpen;
    label = `Course: ${context.courseTitle}`;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 shadow-sm max-w-full truncate">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate font-medium">{label}</span>
      {onClearContext && (
        <button
          type="button"
          onClick={onClearContext}
          className="ml-1 p-0.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-blue-900/60 transition-colors"
          title="Clear Context"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
