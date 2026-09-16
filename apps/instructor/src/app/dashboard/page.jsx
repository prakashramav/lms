'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { Presentation, BookPlus, Users, BarChart3, LogOut, CheckCircle } from 'lucide-react';

export default function InstructorDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
              {user?.name?.charAt(0) || 'I'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Faculty Studio: {user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-sm font-semibold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs uppercase font-semibold tracking-wider">Courses Authored</span>
              <BookPlus className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">4 Active</p>
            <p className="text-xs text-slate-400">1 draft in review</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs uppercase font-semibold tracking-wider">Cohort Enrolled</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">1,248</p>
            <p className="text-xs text-emerald-600 font-semibold">+14% this month</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs uppercase font-semibold tracking-wider">Sandbox Pass Rate</span>
              <BarChart3 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">84.2%</p>
            <p className="text-xs text-slate-400">Average across automated test suites</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
