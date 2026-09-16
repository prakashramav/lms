'use client';

import Link from 'next/link';
import { PlayCircle, BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function ContinueLearningCard({ course }) {
  if (!course) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active course yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore available technology curriculums to kickstart your learning path.
          </p>
        </div>
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
        >
          Explore Courses <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            {course.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Resume where you left off
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {course.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {course.currentLevel}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Current Module: <strong>{course.currentModule}</strong></span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{course.progressPercentage}%</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {course.currentLesson}
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${course.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {course.completedLessons} of {course.totalLessons} lessons completed
        </span>
        <Link
          href={course.courseId ? `/learning/${course.courseId}` : '/learning'}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition"
        >
          <PlayCircle className="w-5 h-5" />
          Continue Learning
        </Link>
      </div>
    </div>
  );
}
