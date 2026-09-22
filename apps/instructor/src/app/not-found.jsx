import React from 'react';
import Link from 'next/link';
import { FileQuestion, LayoutDashboard } from 'lucide-react';

export default function InstructorNotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-slate-50 dark:ring-slate-900">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
            404 Not Found
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Resource Missing
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The requested course module, assessment, or studio view was not found.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
