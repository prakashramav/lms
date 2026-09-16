'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function NavHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <Link
            href="/"
            className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700"
          >
            Apex<span className="text-brand-600">Learn</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/#learn" className="hover:text-brand-600 transition">Courses</Link>
          <Link href="/#practice" className="hover:text-brand-600 transition">Coding Sandbox</Link>
          <Link href="/#interview" className="hover:text-brand-600 transition">AI Interview</Link>
          <Link href="/#career" className="hover:text-brand-600 transition">Jobs</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold border border-brand-200 hover:bg-brand-100 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
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
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition shadow-brand-600/25"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
