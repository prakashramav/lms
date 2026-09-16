'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Presentation, LogOut, LayoutDashboard } from 'lucide-react';

export default function NavHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <Link href="/" className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
              Apex<span className="text-teal-600">Instructor</span>
            </Link>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">Faculty & Content Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-50 text-teal-700 text-sm font-semibold border border-teal-200 hover:bg-teal-100 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Studio Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 transition rounded-lg hover:bg-slate-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition shadow-teal-600/25"
              >
                Faculty Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
