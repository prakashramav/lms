'use client';

import { Sparkles, HelpCircle, Code, Lightbulb, Compass } from 'lucide-react';

export default function SuggestedPrompts({ context, onSelectPrompt }) {
  let prompts = [
    { icon: Lightbulb, text: 'Explain closures in JavaScript with an example' },
    { icon: Code, text: 'How does the React useEffect dependency array work?' },
    { icon: HelpCircle, text: 'What is the difference between synchronous and asynchronous code?' },
    { icon: Compass, text: 'Create a 4-week personalized study plan for full-stack development' },
  ];

  if (context?.problemTitle) {
    prompts = [
      { icon: Lightbulb, text: `Give me a hint for ${context.problemTitle}` },
      { icon: HelpCircle, text: 'What data structure or algorithmic approach works best here?' },
      { icon: Code, text: 'Can you review my code for edge cases and time complexity?' },
    ];
  } else if (context?.lessonTitle) {
    prompts = [
      { icon: Lightbulb, text: `Summarize the main concepts in ${context.lessonTitle}` },
      { icon: Code, text: 'Provide a real-world production code example for this lesson' },
      { icon: HelpCircle, text: 'What are common mistakes developers make with this topic?' },
    ];
  }

  return (
    <div className="py-2">
      <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        Suggested Questions
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(p.text)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-left shadow-xs"
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{p.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
