import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-blue-50 dark:ring-blue-950/20">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            404 Error
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The page or learning resource you are looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Search className="w-4 h-4" />
            Explore Courses
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
