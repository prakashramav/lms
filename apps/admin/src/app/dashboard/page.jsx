'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Activity, Database, LogOut, CheckCircle, Lock } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-2xl font-bold shadow-lg shadow-purple-600/10">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Governance Root: {user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-800 text-slate-300 text-sm font-semibold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-semibold tracking-wider">Platform Status</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400">NORMAL</p>
            <p className="text-xs text-slate-500">All services reporting operational</p>
          </div>

          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-semibold tracking-wider">Active Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">3,892</p>
            <p className="text-xs text-slate-500">Students, Instructors, Admins</p>
          </div>

          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-semibold tracking-wider">Sandbox Isolated</span>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">4 Runners</p>
            <p className="text-xs text-emerald-400 font-semibold">Zero container leaks</p>
          </div>

          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-semibold tracking-wider">Audit Trail</span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">Encrypted</p>
            <p className="text-xs text-slate-500">Immutable SHA-256 tokens</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
