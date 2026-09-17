'use client';

import { useState } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { startMockInterviewSession, submitInterviewAnswer } from '../../services/careerService';
import {
  UserCheck,
  Play,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  Award
} from 'lucide-react';

export default function MockInterviewPage() {
  const { accessToken } = useAuth();

  // Session Config
  const [role, setRole] = useState('Full Stack Developer');
  const [category, setCategory] = useState('TECHNICAL');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');

  // Session Runtime State
  const [session, setSession] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!accessToken) return;
    setStarting(true);
    try {
      const newSession = await startMockInterviewSession(accessToken, {
        role,
        category,
        difficulty,
        questionCount: 3,
      });
      setSession(newSession);
      setCurrentAnswer('');
    } catch (err) {
      alert(err.message || 'Failed to start interview session');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!accessToken || !session || !currentAnswer.trim()) return;
    setSubmitting(true);
    try {
      const updated = await submitInterviewAnswer(
        accessToken,
        session._id,
        session.currentQuestionIndex,
        currentAnswer
      );
      setSession(updated);
      setCurrentAnswer('');
    } catch (err) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = session && session.status === 'COMPLETED';
  const currentQ = session && !isCompleted ? session.questions[session.currentQuestionIndex] : null;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation */}
        <Link
          href="/interview-prep"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Question Bank
        </Link>

        {/* 1. SETUP STAGE */}
        {!session && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> AI Technical Simulator
              </div>
              <h1 className="text-3xl font-extrabold text-white">Mock Interview Practice</h1>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Simulate a real technical screening. Answer one prompt at a time and receive granular architectural feedback and topic coverage scores.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Engineering Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Interview Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="TECHNICAL">Technical Architecture</option>
                  <option value="SYSTEM_DESIGN">System Design</option>
                  <option value="BEHAVIORAL">Behavioral (STAR Method)</option>
                  <option value="HR">Culture &amp; Background</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty Calibration</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="BEGINNER">Entry Level</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Senior / Advanced</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {starting ? 'Configuring Session...' : 'Start 3-Question Practice Session'}
            </button>
          </div>
        )}

        {/* 2. ACTIVE SESSION TURN */}
        {session && !isCompleted && currentQ && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-purple-400">
                Question {session.currentQuestionIndex + 1} of {session.questions.length}
              </span>
              <span>Category: {currentQ.category}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{
                  width: `${((session.currentQuestionIndex + 1) / session.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Text */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Interviewer Question:
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* Answer Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Answer (Explain logic, trade-offs, and technical terms):
              </label>
              <textarea
                rows={7}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Structure your answer clearly. Mention the key concepts, invariants, and edge cases..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 leading-relaxed placeholder-slate-600"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !currentAnswer.trim()}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Evaluating Coverage...' : 'Submit &amp; Continue'}
              </button>
            </div>
          </div>
        )}

        {/* 3. SESSION COMPLETION SCORECARD */}
        {isCompleted && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500 text-purple-400 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Interview Session Completed</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {session.overallFeedback}
              </p>
              <div className="inline-block px-5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-bold">
                Overall Session Score: {session.overallScore}%
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Question Breakdown &amp; Topic Coverage
              </h3>

              {session.questions.map((q, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-slate-200">
                      Q{idx + 1}: {q.question}
                    </span>
                    <span className="text-xs font-bold text-purple-400 shrink-0">
                      {q.score}% Score
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    &quot;{q.studentAnswer}&quot;
                  </p>

                  {q.feedback && (
                    <div className="space-y-2 pt-1">
                      {q.feedback.strengths && q.feedback.strengths.length > 0 && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Strengths: {q.feedback.strengths.join(', ')}</span>
                        </div>
                      )}
                      {q.feedback.suggestions && (
                        <div className="text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">Suggestion: </span>
                          {q.feedback.suggestions}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setSession(null)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Start Another Session
              </button>
              <Link
                href="/career"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
              >
                Return to Career Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
