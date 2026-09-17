'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function InstructorsManagementPage() {
  const { hasPermission } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // ALL, PENDING, ACTIVE, SUSPENDED
  const [isLoading, setIsLoading] = useState(true);

  // Rejection modal
  const [rejectModal, setRejectModal] = useState({ open: false, instructor: null, reason: '' });

  const fetchInstructors = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getInstructors({
        page,
        limit: 15,
        search,
        status: statusTab === 'ALL' ? '' : statusTab,
      });
      setInstructors(res.data?.users || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load instructors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors(1);
  }, [statusTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInstructors(1);
  };

  const handleApprove = async (instructorId) => {
    if (!confirm('Approve this instructor account for course creation?')) return;
    try {
      await adminApi.approveInstructor(instructorId);
      await fetchInstructors(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to approve instructor');
    }
  };

  const handleReject = async () => {
    try {
      await adminApi.rejectInstructor(rejectModal.instructor._id, { reason: rejectModal.reason });
      setRejectModal({ open: false, instructor: null, reason: '' });
      await fetchInstructors(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to reject instructor');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Instructor Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review applicant credentials, authorize authoring permissions, and moderate faculty accounts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          {[
            { id: 'ALL', label: 'All Instructors' },
            { id: 'PENDING', label: 'Pending Applications' },
            { id: 'ACTIVE', label: 'Active Faculty' },
            { id: 'SUSPENDED', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>

        {/* Instructors Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Instructor</th>
                  <th className="p-4">Application Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                      Loading faculty records...
                    </td>
                  </tr>
                ) : instructors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No instructors found for this category.
                    </td>
                  </tr>
                ) : (
                  instructors.map((ins) => (
                    <tr key={ins._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center shrink-0">
                            {ins.name?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{ins.name}</p>
                            <p className="text-[11px] text-slate-500">{ins.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ins.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          ins.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {ins.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(ins.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`/instructors/${ins._id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
                            title="Inspect Profile & Courses"
                          >
                            <Eye className="w-4 h-4" />
                          </a>

                          {hasPermission('instructors.approve') && ins.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(ins._id)}
                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Approve Application"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, instructor: ins, reason: '' })}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Reject Application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
                  onClick={() => fetchInstructors(pagination.page - 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchInstructors(pagination.page + 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Reason Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <XCircle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">Reject Instructor Application</h3>
              </div>
              <p className="text-xs text-slate-400">
                Provide feedback for rejecting <strong className="text-slate-200">{rejectModal.instructor?.name}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="E.g. Incomplete curriculum history, credential verification failed..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, instructor: null, reason: '' })}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
