'use client';

import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAssessments,
  createAssessment,
  fetchQuestionBank,
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
} from '../../services/instructorService';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Award,
  BookOpen,
} from 'lucide-react';

const QUESTION_TYPES = [
  { id: 'MCQ', label: 'Single Choice (MCQ)' },
  { id: 'MULTI_SELECT', label: 'Multiple Select' },
  { id: 'TRUE_FALSE', label: 'True / False' },
  { id: 'SHORT_ANSWER', label: 'Short Answer' },
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function AssessmentStudioPage() {
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState('bank'); // 'bank' or 'assessments'
  const [questions, setQuestions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal / Creator State
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    topic: 'General Programming',
    marks: 1,
    negativeMarks: 0,
    timeLimitSeconds: 60,
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    tags: '',
  });

  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState('');
  const [newAssessmentDesc, setNewAssessmentDesc] = useState('');
  const [newAssessmentPassScore, setNewAssessmentPassScore] = useState(70);

  const loadData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const qQuery = {};
      if (difficultyFilter !== 'all') qQuery.difficulty = difficultyFilter;
      if (typeFilter !== 'all') qQuery.type = typeFilter;
      if (searchQuery.trim()) qQuery.search = searchQuery.trim();

      const [qRes, aRes] = await Promise.all([
        fetchQuestionBank(accessToken, qQuery).catch(() => ({ questions: [] })),
        fetchAssessments(accessToken).catch(() => ({ assessments: [] })),
      ]);

      setQuestions(qRes.questions || []);
      setAssessments(aRes.assessments || []);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [accessToken, difficultyFilter, typeFilter, searchQuery]);

  // Question Creation Handlers
  const handleOptionTextChange = (index, text) => {
    const nextOptions = [...newQuestionData.options];
    nextOptions[index].text = text;
    setNewQuestionData({ ...newQuestionData, options: nextOptions });
  };

  const handleOptionCorrectChange = (index) => {
    const nextOptions = newQuestionData.options.map((opt, i) => {
      if (newQuestionData.type === 'MCQ' || newQuestionData.type === 'TRUE_FALSE') {
        return { ...opt, isCorrect: i === index };
      }
      return i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt;
    });
    setNewQuestionData({ ...newQuestionData, options: nextOptions });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionData.question.trim()) return;

    try {
      const payload = {
        question: newQuestionData.question.trim(),
        type: newQuestionData.type,
        difficulty: newQuestionData.difficulty,
        topic: newQuestionData.topic.trim(),
        marks: Number(newQuestionData.marks) || 1,
        negativeMarks: Number(newQuestionData.negativeMarks) || 0,
        timeLimitSeconds: Number(newQuestionData.timeLimitSeconds) || 60,
        explanation: newQuestionData.explanation.trim(),
        options: newQuestionData.options.filter((o) => o.text.trim()),
        tags: newQuestionData.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await createQuestion(accessToken, payload);
      setFeedback({ type: 'success', message: 'Question saved to Question Bank!' });
      setIsCreatingQuestion(false);
      setNewQuestionData({
        question: '',
        type: 'MCQ',
        difficulty: 'MEDIUM',
        topic: 'General Programming',
        marks: 1,
        negativeMarks: 0,
        timeLimitSeconds: 60,
        explanation: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        tags: '',
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save question' });
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    try {
      await deleteQuestion(accessToken, qId);
      setQuestions((prev) => prev.filter((q) => q._id !== qId));
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete question' });
    }
  };

  const handleDuplicateQuestion = async (qId) => {
    try {
      await duplicateQuestion(accessToken, qId);
      setFeedback({ type: 'success', message: 'Question duplicated successfully!' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate question' });
    }
  };

  // Assessment Creation Handler
  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!newAssessmentTitle.trim()) return;

    try {
      await createAssessment(accessToken, {
        title: newAssessmentTitle.trim(),
        description: newAssessmentDesc.trim(),
        passingScore: Number(newAssessmentPassScore) || 70,
      });
      setFeedback({ type: 'success', message: 'Assessment quiz created!' });
      setIsCreatingAssessment(false);
      setNewAssessmentTitle('');
      setNewAssessmentDesc('');
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create assessment' });
    }
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Assessment & Question Studio
            </h1>
            <p className="text-sm text-slate-400">
              Manage reusable question banks, configure scoring schemes, and assemble quiz suites
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingQuestion(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question</span>
            </button>
            <button
              onClick={() => setIsCreatingAssessment(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-teal-400" />
              <span>New Assessment</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'bank'
                ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Question Bank ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'assessments'
                ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Active Assessments ({assessments.length})
          </button>
        </div>

        {/* TAB 1: QUESTION BANK */}
        {activeTab === 'bank' && (
          <div className="space-y-6">
            {/* SEARCH & FILTERS */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search questions by text or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Question Types</option>
                  <option value="MCQ">Single Choice</option>
                  <option value="MULTI_SELECT">Multiple Select</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                </select>
              </div>
            </div>

            {/* QUESTIONS LIST */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <FileQuestion className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No questions found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Author reusable questions with automatic grading, explanation rationales, and marks.
                </p>
                <button
                  onClick={() => setIsCreatingQuestion(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Question</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.difficulty === 'EASY'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : q.difficulty === 'HARD'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                            {q.type}
                          </span>
                          <span className="text-[11px] text-teal-400 font-semibold">{q.topic}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{q.question}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
                          {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                        </span>
                        <button
                          onClick={() => handleDuplicateQuestion(q._id)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Duplicate Question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* OPTIONS DISPLAY (INSTRUCTOR SEES CORRECT ANSWERS) */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              opt.isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>{opt.text}</span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="font-semibold text-slate-300">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE ASSESSMENTS */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {assessments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                No standalone assessments created yet. Click &quot;New Assessment&quot; to build one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessments.map((a) => (
                  <div key={a._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                        Passing: {a.passingScore || 70}%
                      </span>
                      <span className="text-xs text-slate-400">{a.questions?.length || 0} Questions</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{a.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {a.description || 'Assessment suite.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE QUESTION MODAL */}
        {isCreatingQuestion && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-teal-400" />
                  <span>Author Assessment Question</span>
                </h3>
                <button
                  onClick={() => setIsCreatingQuestion(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Question Stem <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Which hook is appropriate for running side effects in React?"
                    value={newQuestionData.question}
                    onChange={(e) =>
                      setNewQuestionData({ ...newQuestionData, question: e.target.value })
                    }
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Type
                    </label>
                    <select
                      value={newQuestionData.type}
                      onChange={(e) =>
                        setNewQuestionData({ ...newQuestionData, type: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={newQuestionData.difficulty}
                      onChange={(e) =>
                        setNewQuestionData({ ...newQuestionData, difficulty: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newQuestionData.marks}
                      onChange={(e) =>
                        setNewQuestionData({ ...newQuestionData, marks: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      Time (Sec)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="600"
                      value={newQuestionData.timeLimitSeconds}
                      onChange={(e) =>
                        setNewQuestionData({ ...newQuestionData, timeLimitSeconds: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Topic / Domain
                  </label>
                  <input
                    type="text"
                    value={newQuestionData.topic}
                    onChange={(e) =>
                      setNewQuestionData({ ...newQuestionData, topic: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                {/* OPTIONS BUILDER */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold uppercase text-slate-300">
                    Options & Correct Answer
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Check the checkbox next to the option(s) that represent the correct answer.
                  </p>

                  <div className="space-y-2">
                    {newQuestionData.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type={
                            newQuestionData.type === 'MULTI_SELECT' ? 'checkbox' : 'radio'
                          }
                          name="correctOption"
                          checked={opt.isCorrect}
                          onChange={() => handleOptionCorrectChange(i)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded bg-slate-950 border-slate-800"
                        />
                        <input
                          type="text"
                          placeholder={`Option ${i + 1}`}
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(i, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Pedagogical Explanation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Rationale explaining why the correct choice is valid (displayed after student submission)..."
                    value={newQuestionData.explanation}
                    onChange={(e) =>
                      setNewQuestionData({ ...newQuestionData, explanation: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingQuestion(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Save to Question Bank
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE ASSESSMENT MODAL */}
        {isCreatingAssessment && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Create Assessment Quiz</h3>
              <form onSubmit={handleSaveAssessment} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase text-slate-300 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={newAssessmentTitle}
                    onChange={(e) => setNewAssessmentTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newAssessmentDesc}
                    onChange={(e) => setNewAssessmentDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-300 mb-1">
                    Passing Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newAssessmentPassScore}
                    onChange={(e) => setNewAssessmentPassScore(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingAssessment(false)}
                    className="px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
