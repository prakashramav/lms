'use client';

import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  publishProblem,
  unpublishProblem,
  addTestCase,
  deleteTestCase,
} from '../../services/instructorService';
import {
  Code2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Play,
  FileCode,
  Sparkles,
  Layers,
  Clock,
  RotateCw,
} from 'lucide-react';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function PracticeCodingStudioPage() {
  const { accessToken } = useAuth();

  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Create Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('EASY');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Algorithms');
  const [newStarterCode, setNewStarterCode] = useState(
    '// Write your solution here\nfunction solve(input) {\n  return input;\n}'
  );
  const [newPublicInput, setNewPublicInput] = useState('5');
  const [newPublicOutput, setNewPublicOutput] = useState('5');
  const [newHiddenInput, setNewHiddenInput] = useState('100');
  const [newHiddenOutput, setNewHiddenOutput] = useState('100');

  // Selected problem for test case management modal
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [tcInput, setTcInput] = useState('');
  const [tcOutput, setTcOutput] = useState('');
  const [tcIsHidden, setTcIsHidden] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);

  const loadProblems = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const q = {};
      if (difficultyFilter !== 'all') q.difficulty = difficultyFilter;
      if (searchQuery.trim()) q.search = searchQuery.trim();
      const res = await fetchProblems(accessToken, q);
      setProblems(res.problems || []);
    } catch (err) {
      console.error('Error fetching coding problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProblems();
    }, 200);
    return () => clearTimeout(timer);
  }, [accessToken, difficultyFilter, searchQuery]);

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        difficulty: newDifficulty,
        category: newCategory,
        description: newDescription.trim(),
        starterCode: { javascript: newStarterCode },
        testCases: [
          {
            input: newPublicInput,
            expectedOutput: newPublicOutput,
            isHidden: false,
            weight: 10,
          },
          {
            input: newHiddenInput,
            expectedOutput: newHiddenOutput,
            isHidden: true,
            weight: 20,
          },
        ],
      };

      await createProblem(accessToken, payload);
      setFeedback({ type: 'success', message: 'Coding problem created with test suites!' });
      setIsCreating(false);
      setNewTitle('');
      setNewDescription('');
      await loadProblems();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create problem' });
    }
  };

  const handlePublish = async (problemId) => {
    try {
      await publishProblem(accessToken, problemId);
      setFeedback({ type: 'success', message: 'Problem published to practice arena!' });
      await loadProblems();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish problem' });
    }
  };

  const handleUnpublish = async (problemId) => {
    try {
      await unpublishProblem(accessToken, problemId);
      setFeedback({ type: 'success', message: 'Problem unpublished (draft).' });
      await loadProblems();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to unpublish problem' });
    }
  };

  const handleDelete = async (problemId) => {
    if (!confirm('Are you sure you want to delete this coding problem?')) return;
    try {
      await deleteProblem(accessToken, problemId);
      setProblems((prev) => prev.filter((p) => p._id !== problemId));
      setFeedback({ type: 'success', message: 'Problem deleted.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete problem' });
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!tcInput.trim() || !tcOutput.trim() || !selectedProblem) return;
    setTcLoading(true);
    try {
      const created = await addTestCase(accessToken, selectedProblem._id, {
        input: tcInput.trim(),
        expectedOutput: tcOutput.trim(),
        isHidden: tcIsHidden,
        weight: tcIsHidden ? 20 : 10,
      });

      setSelectedProblem((prev) => ({
        ...prev,
        testCases: [...(prev.testCases || []), created],
      }));

      setTcInput('');
      setTcOutput('');
      setTcIsHidden(false);
      await loadProblems();
    } catch (err) {
      alert(err.message || 'Failed to add test case');
    } finally {
      setTcLoading(false);
    }
  };

  const handleDeleteTestCase = async (tcId) => {
    if (!selectedProblem) return;
    try {
      await deleteTestCase(accessToken, selectedProblem._id, tcId);
      setSelectedProblem((prev) => ({
        ...prev,
        testCases: prev.testCases.filter((t) => t._id !== tcId),
      }));
      await loadProblems();
    } catch (err) {
      alert(err.message || 'Failed to delete test case');
    }
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Coding Practice &amp; Sandboxes
            </h1>
            <p className="text-sm text-slate-400">
              Author algorithm challenges, configure input/output test suites, and protect hidden tests
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/25 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coding Problem</span>
          </button>
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

        {/* SEARCH & FILTER BAR */}
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search problems by title, topic, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* PROBLEMS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Code2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No coding problems found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create an automated coding problem with test cases to evaluate real developer skill.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
            >
              Create First Problem
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((prob) => {
              const publicTests = (prob.testCases || []).filter((tc) => !tc.isHidden).length;
              const hiddenTests = (prob.testCases || []).filter((tc) => tc.isHidden).length;
              const isPublishable = publicTests >= 1 && hiddenTests >= 1;

              return (
                <div
                  key={prob._id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between space-y-4 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prob.difficulty === 'EASY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : prob.difficulty === 'HARD'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          prob.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {prob.status || 'DRAFT'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{prob.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{prob.description}</p>

                    {/* TEST CASES COUNTER */}
                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Eye className="w-3.5 h-3.5" />
                        {publicTests} Public
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-teal-300 font-semibold">
                        <EyeOff className="w-3.5 h-3.5" />
                        {hiddenTests} Hidden
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProblem(prob)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Test Suites
                    </button>

                    <div className="flex items-center gap-2">
                      {prob.status === 'DRAFT' ? (
                        <button
                          onClick={() => handlePublish(prob._id)}
                          disabled={!isPublishable}
                          title={!isPublishable ? 'Requires at least 1 public and 1 hidden test case' : 'Publish problem'}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 transition"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublish(prob._id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                        >
                          Unpublish
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(prob._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete Problem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE PROBLEM MODAL */}
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-teal-400" />
                  <span>Author Coding Challenge</span>
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateProblem} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase text-slate-300 mb-1">
                      Problem Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reverse Linked List"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-slate-300 mb-1">
                    Problem Narrative &amp; Constraints <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Given an array of numbers, return the indices of two numbers that add up to target..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-slate-300 mb-1">
                    Starter Function Skeleton
                  </label>
                  <textarea
                    rows={4}
                    value={newStarterCode}
                    onChange={(e) => setNewStarterCode(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400"
                  />
                </div>

                {/* Initial Public & Hidden Test Case */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Initial Test Suites (Required for Publication)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Public Test Case
                      </span>
                      <input
                        type="text"
                        placeholder="Input (e.g. 5)"
                        value={newPublicInput}
                        onChange={(e) => setNewPublicInput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. 5)"
                        value={newPublicOutput}
                        onChange={(e) => setNewPublicOutput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Hidden Test Case
                      </span>
                      <input
                        type="text"
                        placeholder="Input (e.g. 100)"
                        value={newHiddenInput}
                        onChange={(e) => setNewHiddenInput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. 100)"
                        value={newHiddenOutput}
                        onChange={(e) => setNewHiddenOutput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md"
                  >
                    Create Challenge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TEST CASES MANAGEMENT MODAL */}
        {selectedProblem && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-teal-400" />
                    <span>Test Suites: {selectedProblem.title}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Protected sandbox inputs and expected outputs
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProblem(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* ADD TEST CASE INLINE */}
              <form onSubmit={handleAddTestCase} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Add New Test Case
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Raw Input (Stdin / Arg)
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={tcInput}
                      onChange={(e) => setTcInput(e.target.value)}
                      placeholder="e.g. [2, 7, 11, 15], 9"
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Expected Output
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={tcOutput}
                      onChange={(e) => setTcOutput(e.target.value)}
                      placeholder="e.g. [0, 1]"
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tcIsHidden}
                      onChange={(e) => setTcIsHidden(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Hidden Test Case (Never revealed to students)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={tcLoading}
                    className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-500 disabled:opacity-50"
                  >
                    {tcLoading ? 'Adding...' : 'Add Case'}
                  </button>
                </div>
              </form>

              {/* CURRENT TEST CASES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Configured Test Suites ({selectedProblem.testCases?.length || 0})
                </h4>

                {(!selectedProblem.testCases || selectedProblem.testCases.length === 0) ? (
                  <p className="text-xs text-slate-500">No test cases configured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProblem.testCases.map((tc, idx) => (
                      <div
                        key={tc._id || idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                              tc.isHidden
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {tc.isHidden ? 'Hidden' : 'Public'}
                          </span>
                          <div className="truncate">
                            <span className="text-slate-400">In: </span>
                            <span className="text-slate-200">{tc.input}</span>
                            <span className="text-slate-400 ml-3">Exp: </span>
                            <span className="text-emerald-400">{tc.expectedOutput}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTestCase(tc._id)}
                          className="p-1 text-slate-400 hover:text-rose-400 shrink-0"
                          title="Delete Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
