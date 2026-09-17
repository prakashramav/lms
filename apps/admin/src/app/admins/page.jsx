'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Plus,
  Ban,
  CheckCircle,
  KeyRound,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { id: 'users.read', label: 'Read Users / Students / Instructors' },
  { id: 'users.suspend', label: 'Suspend / Activate Users' },
  { id: 'instructors.approve', label: 'Approve / Reject Instructors' },
  { id: 'courses.read', label: 'Read Courses' },
  { id: 'courses.review', label: 'Review Course Submissions' },
  { id: 'courses.approve', label: 'Approve / Reject Courses' },
  { id: 'courses.publish', label: 'Publish / Unpublish Courses' },
  { id: 'assessments.manage', label: 'Supervise Assessment Bank' },
  { id: 'problems.manage', label: 'Supervise Coding Problem Arena' },
  { id: 'categories.manage', label: 'Create / Archive Categories' },
  { id: 'reports.manage', label: 'Triage / Resolve Incident Reports' },
  { id: 'analytics.read', label: 'View Platform Analytics & AI Telemetry' },
  { id: 'audit.read', label: 'View & Export Audit Ledger' },
  { id: 'settings.manage', label: 'Manage Settings & Feature Flags' },
];

export default function AdminManagementPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: Create Admin
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    permissions: [],
  });

  // Modal: Edit Permissions
  const [permModal, setPermModal] = useState({ open: false, admin: null, permissions: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAdmins();
      setAdmins(res.data || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchAdmins();
  }, [isSuperAdmin]);

  const handleTogglePermInForm = (permId) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleTogglePermInModal = (permId) => {
    setPermModal((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.createAdmin(form);
      setCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'ADMIN', permissions: [] });
      await fetchAdmins();
    } catch (err) {
      alert(err.message || 'Failed to provision administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePerms = async () => {
    setIsSubmitting(true);
    try {
      await adminApi.updateAdminPermissions(permModal.admin._id, {
        permissions: permModal.permissions,
      });
      setPermModal({ open: false, admin: null, permissions: [] });
      await fetchAdmins();
    } catch (err) {
      alert(err.message || 'Failed to update permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (adminId) => {
    if (!confirm('Are you sure you want to disable this administrator account?')) return;
    try {
      await adminApi.disableAdmin(adminId);
      await fetchAdmins();
    } catch (err) {
      alert(err.message || 'Failed to disable admin');
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPER ADMIN RESTRICTED
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Administrator Governance</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Provision administrative staff accounts, assign granular role permissions, and control operator lifecycles
            </p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Administrator</span>
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Role Tier</th>
                  <th className="p-4">Explicit Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                      Loading staff roster...
                    </td>
                  </tr>
                ) : (
                  admins.map((adm) => (
                    <tr key={adm._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                            {adm.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{adm.name}</p>
                            <p className="text-[11px] text-slate-500">{adm.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          adm.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {adm.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {adm.role === 'SUPER_ADMIN' ? (
                          <span className="text-xs text-amber-400 font-medium italic">Universal Pass-Through</span>
                        ) : (
                          <span className="text-xs text-slate-300 font-mono">
                            {adm.permissions?.length || 0} permissions granted
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          adm.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {adm.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {adm.role !== 'SUPER_ADMIN' && (
                            <>
                              <button
                                onClick={() =>
                                  setPermModal({
                                    open: true,
                                    admin: adm,
                                    permissions: adm.permissions || [],
                                  })
                                }
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                              >
                                Edit Permissions
                              </button>
                              {adm.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleDisable(adm._id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                                  title="Disable Account"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
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
        </div>

        {/* Create Administrator Modal */}
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-white">Provision Administrator Account</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Rachel Zane"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="rachel@example.com"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Role Tier
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN (Subject to explicit permissions)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Unrestricted)</option>
                  </select>
                </div>

                {form.role === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Granted Permissions
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <label key={perm.id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm.id)}
                            onChange={() => handleTogglePermInForm(perm.id)}
                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Provisioning...' : 'Confirm Provisioning'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {permModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                Edit Permissions: {permModal.admin?.name}
              </h3>
              <p className="text-xs text-slate-400">
                Grant or revoke granular system permissions for this administrative operator.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permModal.permissions.includes(perm.id)}
                      onChange={() => handleTogglePermInModal(perm.id)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPermModal({ open: false, admin: null, permissions: [] })}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSavePerms}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition"
                >
                  {isSubmitting ? 'Updating...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
