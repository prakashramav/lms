'use client';

import { CheckSquare, Clock, FileCode, Layers, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PendingTasksCard({ tasks }) {
  const taskList = tasks || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DUE_SOON':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Due Soon
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Pending
          </span>
        );
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4 text-brand-600" />;
      case 'PROJECT':
        return <Layers className="w-4 h-4 text-purple-600" />;
      default:
        return <FileCode className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Assignments</h3>
            <p className="text-xs text-slate-400">Action items requiring completion</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-slate-400">
          {taskList.length} Active
        </span>
      </div>

      <div className="space-y-3">
        {taskList.map((task) => (
          <div
            key={task.id}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs flex-shrink-0">
                {getTypeIcon(task.type)}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{task.type}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{task.estimatedMinutes}m
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(task.status)}
              <Link
                href="/learning"
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
