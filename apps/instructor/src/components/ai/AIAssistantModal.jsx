'use client';

import { useState } from 'react';
import {
  Sparkles,
  X,
  FileText,
  FileQuestion,
  Code2,
  Copy,
  CheckCircle2,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import {
  generateLessonOutline,
  generateQuestions,
  generateCodingProblem,
} from '../../services/instructorService';

export default function AIAssistantModal({ accessToken, isOpen, onClose, onApplyDraft }) {
  const [activeMode, setActiveMode] = useState('outline'); // 'outline', 'questions', 'problem'
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(3);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [editableResult, setEditableResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedResult(null);

    try {
      let res;
      if (activeMode === 'outline') {
        res = await generateLessonOutline(accessToken, { topic, level });
      } else if (activeMode === 'questions') {
        res = await generateQuestions(accessToken, { topic, difficulty, count: Number(count) });
      } else {
        res = await generateCodingProblem(accessToken, { topic, difficulty });
      }

      setGeneratedResult(res);
      setEditableResult(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res));
    } catch (err) {
      console.error('AI authoring error:', err);
      setError(err.message || 'AI generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 rounded-3xl border border-teal-500/30 shadow-2xl shadow-teal-950/40 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Pedagogical Authoring Assistant</h3>
              <p className="text-[11px] text-slate-400">
                Generate editable drafts for curriculum, quizzes, and algorithmic challenges
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE SELECTOR */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'outline', label: 'Lesson Outline', icon: FileText },
            { id: 'questions', label: 'Quiz Questions', icon: FileQuestion },
            { id: 'problem', label: 'Coding Challenge', icon: Code2 },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id);
                  setGeneratedResult(null);
                  setError(null);
                }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  isActive
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                Domain / Topic
              </label>
              <input
                type="text"
                required
                placeholder="e.g. JavaScript Closures and Lexical Scope"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activeMode === 'outline' ? (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                    Student Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              )}

              {activeMode === 'questions' && (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-300 mb-1">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Drafting Blueprint...' : 'Generate AI Draft'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* RESULTS & EDITABLE PREVIEW */}
        {generatedResult && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Review &amp; Edit AI Draft (Not Published)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Draft</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={10}
              value={editableResult}
              onChange={(e) => setEditableResult(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 leading-relaxed focus:outline-none"
            />

            <p className="text-[11px] text-slate-500">
              Instructor must inspect and validate all generated test cases and answers before adopting or publishing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
