'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ReportsManagementPage() {
  const { hasPermission } = useAuth();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Resolve modal
  const [resolveModal, setResolveModal] = useState({ open: false, report: null, status: 'RESOLVED', actionTaken: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReports({
        page,
        limit: 15,
        status: statusFilter,
        targetType: targetTypeFilter,
      });
      setReports(res.data?.reports || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter, targetTypeFilter]);

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      await adminApi.updateReport(resolveModal.report._id, {
        status: resolveModal.status,
        actionTaken: resolveModal.actionTaken,
        resolutionNotes: resolveModal.notes,
      });
      setResolveModal({ open: false, report: null, status: 'RESOLVED', actionTaken: '', notes: '' });
      await fetchReports(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update report');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Moderation & Incident Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review user-reported violations, investigate broken curriculum resources, and resolve issues ({pagination.total} total)
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Incident States</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Targets</option>
              <option value="COURSE">Course</option>
              <option value="LESSON">Lesson</option>
              <option value="PROBLEM">Coding Problem</option>
              <option value="USER">User Account</option>
              <option value="SYSTEM">System Platform</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Target</th>
                  <th className="p-4">Violation / Reason</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                      Loading incident reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {r.targetType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {r.reason}
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs">
                        <p className="line-clamp-2">{r.description}</p>
                      </td>
                      <td className="p-4 text-slate-400">
                        {r.reporterId?.name || 'Anonymous User'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'OPEN' ? 'bg-amber-500/20 text-amber-400' :
                          r.status === 'INVESTIGATING' ? 'bg-blue-500/20 text-blue-400' :
                          r.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {hasPermission('reports.manage') && r.status !== 'RESOLVED' && r.status !== 'DISMISSED' && (
                          <button
                            onClick={() =>
                              setResolveModal({
                                open: true,
                                report: r,
                                status: 'RESOLVED',
                                actionTaken: '',
                                notes: '',
                              })
                            }
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                          >
                            Triage & Resolve
                          </button>
                        )}
                        {(r.status === 'RESOLVED' || r.status === 'DISMISSED') && (
                          <span className="text-[11px] text-slate-500 italic">
                            {r.resolution?.actionTaken || 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReports(pagination.page - 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchReports(pagination.page + 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Triage & Resolution Modal */}
        {resolveModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Triage Incident Report</h3>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p><strong>Target:</strong> {resolveModal.report?.targetType}</p>
                <p><strong>Reason:</strong> {resolveModal.report?.reason}</p>
                <p className="line-clamp-2"><strong>Details:</strong> {resolveModal.report?.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Resolution Decision
                </label>
                <select
                  value={resolveModal.status}
                  onChange={(e) => setResolveModal({ ...resolveModal, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="RESOLVED">Resolved (Remediation taken)</option>
                  <option value="DISMISSED">Dismissed (False positive / Inapplicable)</option>
                  <option value="INVESTIGATING">Mark as Under Investigation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Action Taken / Notes
                </label>
                <textarea
                  rows={3}
                  value={resolveModal.actionTaken}
                  onChange={(e) => setResolveModal({ ...resolveModal, actionTaken: e.target.value })}
                  placeholder="Describe the action executed or why the incident was dismissed..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal({ open: false, report: null, status: 'RESOLVED', actionTaken: '', notes: '' })}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdate}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
