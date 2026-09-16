'use client';

import Link from 'next/link';
import { Clock, BookOpen, CheckCircle2, ArrowRight, Sparkles, User } from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Intermediate: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Advanced: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

export default function CourseCard({ course, enrollment = null }) {
  const isEnrolled = !!enrollment;
  const progressPercentage = enrollment?.progressPercentage ?? 0;
  const isCompleted = enrollment?.status === 'COMPLETED' || progressPercentage === 100;

  // Determine CTA
  let ctaLabel = 'View Course';
  let ctaHref = `/courses/${course.slug}`;

  if (isEnrolled) {
    if (isCompleted) {
      ctaLabel = 'Review Course';
      ctaHref = `/learning/${course._id}`;
    } else if (progressPercentage > 0) {
      ctaLabel = 'Continue Learning';
      ctaHref = `/learning/${course._id}`;
    } else {
      ctaLabel = 'Start Learning';
      ctaHref = `/learning/${course._id}`;
    }
  }

  const difficultyClass = DIFFICULTY_STYLES[course.difficulty] || DIFFICULTY_STYLES.Beginner;

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 overflow-hidden">
      {/* Course Thumbnail / Gradient Header */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-tr from-slate-900 to-brand-900">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white/90 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700">
            <BookOpen className="w-12 h-12 text-white/40 mb-2" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              {course.category}
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {course.featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/90 text-amber-950 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Featured
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${difficultyClass} backdrop-blur-md`}>
            {course.difficulty}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Category & Duration */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
              {course.category}
            </span>
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.duration}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            <Link href={`/courses/${course.slug}`}>
              {course.title}
            </Link>
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {course.shortDescription || course.description}
          </p>

          {/* Skills / Tech stack tags */}
          {course.skills && course.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {course.skills.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                  +{course.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info: Instructor + Progress or CTA */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold">
                {course.instructor?.name ? course.instructor.name.charAt(0) : <User className="w-3 h-3" />}
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">
                {course.instructor?.name || 'Instructor'}
              </span>
            </div>

            {isEnrolled && (
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completed
                  </>
                ) : (
                  `${progressPercentage}% Done`
                )}
              </span>
            )}
          </div>

          {/* Progress bar if enrolled */}
          {isEnrolled && (
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

          {/* Action CTA Button */}
          <Link
            href={ctaHref}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isEnrolled
                ? 'bg-brand-600 hover:bg-brand-700 text-white'
                : 'border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {ctaLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
