'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchInterviewQuestions } from '../../services/careerService';
import {
  UserCheck,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  BookOpen,
  Code2,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function InterviewPrepPage() {
  const { accessToken } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInterviewQuestions(
        accessToken,
        selectedCategory !== 'ALL' ? selectedCategory : null,
        selectedDifficulty !== 'ALL' ? selectedDifficulty : null
      );
      setQuestions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const toggleExpand = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/60 border border-purple-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5" /> Technical &amp; Behavioral Question Bank
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Interview Preparation Hub</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Master the exact architectural trade-offs, async JavaScript questions, and STAR behavioral answers top engineering teams test.
            </p>
          </div>

          <Link
            href="/mock-interview"
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <Play className="w-4 h-4 fill-white" /> Start AI Mock Session
          </Link>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'ALL', label: 'All Topics' },
              { key: 'TECHNICAL', label: 'Technical' },
              { key: 'BEHAVIORAL', label: 'Behavioral (STAR)' },
              { key: 'SYSTEM_DESIGN', label: 'System Design' },
              { key: 'HR', label: 'Culture & HR' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="ALL">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        {/* Question Bank List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading interview questions...</div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            No interview questions found for this topic filter.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q._id;

              return (
                <div
                  key={q._id || idx}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                          {q.category}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {q.difficulty}
                        </span>
                        {q.role && (
                          <span className="text-[10px] text-slate-500">• {q.role}</span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleExpand(q._id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expandable Explanation & Key Concepts */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                      {q.expectedTopics && q.expectedTopics.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-slate-300 block mb-1.5">
                            Concepts Evaluated by Interviewers:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {q.expectedTopics.map((topic) => (
                              <span
                                key={topic}
                                className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-indigo-300"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.explanation && (
                        <div>
                          <span className="text-xs font-bold text-slate-300 block mb-1">
                            Key Architectural / Model Answer Breakdown:
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
