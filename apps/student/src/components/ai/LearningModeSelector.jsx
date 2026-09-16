'use client';

const MODES = [
  { id: 'GUIDED', label: 'Guided', desc: 'Socratic hints & questions' },
  { id: 'DIRECT', label: 'Direct', desc: 'Direct answers & code' },
  { id: 'EXPLANATION', label: 'Deep Dive', desc: 'Detailed concepts & architecture' },
];

export default function LearningModeSelector({ mode = 'GUIDED', onSelectMode }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
      <span className="hidden sm:inline-block px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Mode:
      </span>
      {MODES.map((m) => {
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMode(m.id)}
            title={m.desc}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
