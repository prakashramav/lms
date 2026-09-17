'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchSkills } from '../../services/intelligenceService';
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Brain,
  ShieldCheck,
  TrendingUp,
  Layers,
  BookOpen
} from 'lucide-react';

const MASTERY_COLORS = {
  NOT_STARTED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  INTRODUCED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  PRACTICING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  DEVELOPING: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  PROFICIENT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  REVIEW_RECOMMENDED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

const MASTERY_LABELS = {
  NOT_STARTED: 'Not Started',
  INTRODUCED: 'Introduced',
  PRACTICING: 'Practicing',
  DEVELOPING: 'Developing',
  PROFICIENT: 'Proficient',
  REVIEW_RECOMMENDED: 'Review Recommended',
};

export default function SkillsPage() {
  const { accessToken } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [error, setError] = useState(null);

  const loadSkills = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkills(accessToken);
      setSkills(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load skills taxonomy.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const categories = ['ALL', ...new Set(skills.map((s) => s.category).filter(Boolean))];
  const filtered = selectedCategory === 'ALL' ? skills : skills.filter((s) => s.category === selectedCategory);

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Skill Mastery Taxonomy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Skill Progress Graph
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Transparent tracking of your technical proficiencies across software development disciplines.
            </p>
          </div>

          <Link
            href="/practice"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm shrink-0"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Practice Challenges</span>
          </Link>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skill Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Analyzing your skill matrix...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Skills In This Category</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select another category or enroll in courses to activate new skills.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((skill) => {
              const colorClass = MASTERY_COLORS[skill.masteryLevel] || MASTERY_COLORS.NOT_STARTED;
              const label = MASTERY_LABELS[skill.masteryLevel] || skill.masteryLevel;

              return (
                <div
                  key={skill._id}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {skill.category || 'General'}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorClass}`}
                      >
                        {label}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {skill.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Practice attempts:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {skill.practiceCount || 0}
                      </span>
                    </div>

                    {skill.lastPracticedAt && (
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Last active:</span>
                        <span>{new Date(skill.lastPracticedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        href={`/practice?topic=${encodeURIComponent(skill.name)}`}
                        className="inline-flex items-center justify-between w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition"
                      >
                        <span>Reinforce Skill</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Methodology Note */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
          <Brain className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            Mastery states reflect recent practice, assessment consistency, and problem-solving history. They are directional guideposts to focus your study, not scientific absolutes.
          </span>
        </div>
      </div>
    </StudentLayout>
  );
}
