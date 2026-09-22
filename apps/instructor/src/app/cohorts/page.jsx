'use client';

import { useState, useEffect, useCallback } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function InstructorCohortsPage() {
  const { accessToken } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortDashboard, setCohortDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // New cohort form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCode, setNewCohortCode] = useState('');
  const [newCohortTrack, setNewCohortTrack] = useState('FULLSTACK');
  const [createLoading, setCreateLoading] = useState(false);

  const loadCohorts = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cohorts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setCohorts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load cohorts', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadCohorts();
  }, [loadCohorts]);

  const loadCohortDashboard = async (cohortId) => {
    if (!accessToken || !cohortId) return;
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setCohortDashboard(data.data);
      }
    } catch (err) {
      console.error('Failed to load cohort dashboard', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleSelectCohort = (cohort) => {
    setSelectedCohort(cohort);
    loadCohortDashboard(cohort._id);
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName || !newCohortCode) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cohorts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: newCohortName,
          code: newCohortCode,
          track: newCohortTrack,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewCohortName('');
        setNewCohortCode('');
        loadCohorts();
      }
    } catch (err) {
      console.error('Failed to create cohort', err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Institutional Cohort Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track student batches, monitor aggregate completion velocity, and pinpoint drop-off risks early.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Create Cohort
          </button>
        </div>

        {/* Cohort Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cohort List Column */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Cohorts ({cohorts.length})
              </span>
              <button onClick={loadCohorts} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading cohorts...</div>
            ) : cohorts.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 space-y-2">
                <p>No cohorts created yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 font-semibold text-xs"
                >
                  Create your first cohort
                </button>
              </div>
            ) : (
              cohorts.map((c) => {
                const isSelected = selectedCohort?._id === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCohort(c)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {c.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      <span>{c.track}</span>
                      <span>•</span>
                      <span>{c.students?.length || 0} Students</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cohort Detail & Analytics Dashboard */}
          <div className="md:col-span-2">
            {!selectedCohort ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 stroke-1" />
                <p className="text-sm font-medium">Select a cohort from the list to inspect analytics and drop-off risks.</p>
              </div>
            ) : dashboardLoading ? (
              <div className="p-12 text-center text-slate-400">Loading cohort metrics...</div>
            ) : cohortDashboard ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cohortDashboard.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Code: {cohortDashboard.code} • Track: {cohortDashboard.track}</p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-400">Total Enrolled</span>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                      {cohortDashboard.totalStudents}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-blue-500">Average Progress</span>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                      {cohortDashboard.metrics.averageProgress}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-emerald-500">Completion Rate</span>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {cohortDashboard.metrics.completionRate}%
                    </p>
                  </div>
                </div>

                {/* Drop-off Risk Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Drop-off Risk Detection ({cohortDashboard.dropOffRisk?.length || 0})
                  </h4>

                  {cohortDashboard.dropOffRisk?.length === 0 ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      Great engagement! No students are currently exhibiting high drop-off risk in this cohort.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      {cohortDashboard.dropOffRisk.map((student) => (
                        <div key={student.studentId} className="p-3.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white">{student.name}</span>
                            <span className="text-slate-400 ml-2">({student.email})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">{student.currentProgress}% Progress</span>
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
                              {student.riskLevel} RISK
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal: Create Cohort */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Cohort</h3>
              <form onSubmit={handleCreateCohort} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cohort Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCohortName}
                    onChange={(e) => setNewCohortName(e.target.value)}
                    placeholder="e.g. Batch 2026 - Frontend Track Alpha"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cohort Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newCohortCode}
                    onChange={(e) => setNewCohortCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BATCH-2026-FE"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Track
                  </label>
                  <select
                    value={newCohortTrack}
                    onChange={(e) => setNewCohortTrack(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="FRONTEND">Frontend Track</option>
                    <option value="BACKEND">Backend Track</option>
                    <option value="FULLSTACK">Full Stack Track</option>
                    <option value="DATA_SCIENCE">Data Science Track</option>
                    <option value="AI_ENGINEERING">AI Engineering Track</option>
                    <option value="DEVOPS">DevOps Track</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow"
                  >
                    {createLoading ? 'Creating...' : 'Create Cohort'}
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
