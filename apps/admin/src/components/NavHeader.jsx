'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';

export default function NavHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <Link href="/" className="font-extrabold text-lg tracking-tight text-white block leading-tight">
              Apex<span className="text-purple-400">Admin</span>
            </Link>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">Root Governance Console</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-sm font-semibold border border-purple-800 hover:bg-purple-900/60 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition shadow-purple-600/20"
              >
                Admin Gateway
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
