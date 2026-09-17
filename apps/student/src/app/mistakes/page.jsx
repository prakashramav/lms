'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchMistakes, retryMistake } from '../../services/intelligenceService';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  Clock,
  Check,
  Code
} from 'lucide-react';

export default function MistakesPage() {
  const { accessToken } = useAuth();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterResolved, setFilterResolved] = useState('all'); // 'all', 'unresolved', 'resolved'
  const [searchTopic, setSearchTopic] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [error, setError] = useState(null);

  const loadMistakes = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const query = {};
      if (filterResolved === 'unresolved') query.resolved = 'false';
      if (filterResolved === 'resolved') query.resolved = 'true';
      const data = await fetchMistakes(accessToken, query);
      setMistakes(data.mistakes || []);
    } catch (err) {
      setError(err.message || 'Failed to load your mistake log.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterResolved]);

  useEffect(() => {
    loadMistakes();
  }, [loadMistakes]);

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await retryMistake(accessToken, id);
      setMistakes((prev) =>
        prev.map((m) => (m._id === id ? { ...m, resolved: true, retryCount: (m.retryCount || 0) + 1 } : m))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const filtered = mistakes.filter((m) => {
    if (!searchTopic) return true;
    return m.topic?.toLowerCase().includes(searchTopic.toLowerCase()) || m.promptSnippet?.toLowerCase().includes(searchTopic.toLowerCase());
  });

  const unresolvedCount = mistakes.filter((m) => !m.resolved).length;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Personal Learning History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Mistake Notebook
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Transform misunderstandings into breakthroughs with targeted explanations and guided retries.
            </p>
          </div>

          <Link
            href="/ai-tutor?prompt=Review the concepts I got wrong in my recent assessments and coding challenges."
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Mistake Walkthrough</span>
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic or prompt..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterResolved('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterResolved === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({mistakes.length})
            </button>
            <button
              onClick={() => setFilterResolved('unresolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterResolved === 'unresolved'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Needs Practice ({unresolvedCount})
            </button>
            <button
              onClick={() => setFilterResolved('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterResolved === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Resolved ({mistakes.length - unresolvedCount})
            </button>
          </div>
        </div>

        {/* Mistake Entries */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your mistake log...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {filterResolved === 'unresolved' ? 'No Unresolved Mistakes' : 'No Mistakes Recorded'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {filterResolved === 'unresolved'
                ? "You've successfully resolved all identified mistake concepts! Great job."
                : 'Whenever you miss an assessment question or fail a coding test, it will appear here for guided revision.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item._id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border transition space-y-4 ${
                  item.resolved
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/5'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.topic}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
                      {item.sourceType}
                    </span>
                    {item.mistakeType && (
                      <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                        {item.mistakeType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.resolved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                        Mastered / Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Needs Practice
                      </span>
                    )}
                  </div>
                </div>

                {/* Prompt Preview */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.promptSnippet || 'Target challenge question'}
                  </h4>
                </div>

                {/* Student's Attempted Answer */}
                {item.studentAnswer && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Submission / Answer</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(item.studentAnswer, null, 2)}</pre>
                  </div>
                )}

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Key Concept to Remember:</span>
                    </div>
                    <p className="leading-relaxed">{item.explanation}</p>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Logged {new Date(item.createdAt).toLocaleDateString()} · Retries: {item.retryCount || 0}
                  </span>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/ai-tutor?prompt=Please explain this concept from my mistake notebook: ${encodeURIComponent(item.topic + ' - ' + (item.promptSnippet || ''))}`}
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Ask AI Tutor</span>
                    </Link>

                    {!item.resolved && (
                      <button
                        onClick={() => handleRetry(item._id)}
                        disabled={retryingId === item._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${retryingId === item._id ? 'animate-spin' : ''}`} />
                        <span>Mark as Understood</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
