'use client';

import { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchGoals, createGoal, updateGoal, deleteGoal } from '../../services/intelligenceService';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X
} from 'lucide-react';

export default function GoalsPage() {
  const { accessToken } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'COURSE_COMPLETION',
    target: 10,
    deadline: '',
  });

  const loadGoals = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoals(accessToken);
      setGoals(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    setSubmitting(true);
    try {
      await createGoal(accessToken, {
        ...formData,
        target: Number(formData.target),
        deadline: formData.deadline ? new Date(formData.deadline) : null,
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'COURSE_COMPLETION',
        target: 10,
        deadline: '',
      });
      loadGoals();
    } catch (err) {
      setError(err.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this learning goal?')) return;
    try {
      await deleteGoal(accessToken, id);
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncrement = async (goal) => {
    try {
      const nextVal = (goal.currentValue || 0) + 1;
      const updated = await updateGoal(accessToken, goal._id, { currentValue: nextVal });
      setGoals((prev) => prev.map((g) => (g._id === goal._id ? updated : g)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5" />
              <span>Personalized Milestones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Learning Goals
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Set clear learning targets, monitor your velocity, and celebrate milestones.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your goals...</div>
        ) : error ? (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Your First Learning Goal</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Setting specific practice targets keeps your momentum consistent and unlocks achievements.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const current = goal.currentValue || 0;
              const target = goal.target || 1;
              const pct = Math.min(100, Math.round((current / target) * 100));
              const isCompleted = goal.status === 'COMPLETED' || pct >= 100;

              return (
                <div
                  key={goal._id}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border transition space-y-5 flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {goal.type.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => handleDelete(goal._id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {current} / {target} completed
                      </span>
                      <span className={isCompleted ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}>
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      {goal.deadline ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>Continuous Goal</span>
                      )}

                      {!isCompleted && (
                        <button
                          onClick={() => handleIncrement(goal)}
                          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition"
                        >
                          + Log Progress
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Learning Goal</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Practice 20 coding problems"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="COURSE_COMPLETION">Course Completion</option>
                    <option value="CODING">Coding Practice</option>
                    <option value="ASSESSMENT">Assessment / Quiz</option>
                    <option value="SKILL">Skill Mastery</option>
                    <option value="DAILY_PRACTICE">Daily Practice</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Count *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
