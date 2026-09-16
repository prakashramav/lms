'use client';

import Link from 'next/link';
import {
  Clock,
  HelpCircle,
  Award,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Intermediate:
    'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Advanced:
    'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

const TYPE_LABELS = {
  QUIZ: 'Quick Quiz',
  PRACTICE_TEST: 'Practice Test',
  MODULE_ASSESSMENT: 'Module Assessment',
  COURSE_ASSESSMENT: 'Course Final Assessment',
  CODING_ASSESSMENT: 'Coding Assessment',
};

export default function AssessmentCard({ assessment }) {
  const stats = assessment.studentStats || {};
  const hasInProgress = !!stats.inProgressAttemptId;
  const attemptsUsed = stats.attemptsCount || 0;
  const maxAttempts = assessment.maxAttempts || 0;
  const attemptsRemaining =
    maxAttempts > 0 ? Math.max(0, maxAttempts - attemptsUsed) : null;
  const hasPassed = stats.hasPassed;
  const bestPercentage = stats.bestPercentage;

  const difficultyClass =
    DIFFICULTY_STYLES[assessment.difficulty] || DIFFICULTY_STYLES.Beginner;

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 overflow-hidden">
      {/* Card Header: Type, Difficulty, Best Score */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider truncate">
            {TYPE_LABELS[assessment.type] || assessment.type}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${difficultyClass}`}
          >
            {assessment.difficulty}
          </span>
        </div>

        {bestPercentage !== null && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
              hasPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
            }`}
          >
            {hasPassed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Best: {bestPercentage}%
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Course Association Tag */}
          {assessment.courseId && (
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 line-clamp-1">
              {assessment.courseId.title}
              {assessment.moduleId ? ` • ${assessment.moduleId.title}` : ''}
            </p>
          )}

          {/* Assessment Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            <Link href={`/assessments/${assessment.slug || assessment._id}`}>
              {assessment.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {assessment.description ||
              'Test your knowledge and validate your competency on this subject.'}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>{assessment.questionCount || 0} Questions</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{assessment.duration}m Limit</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Pass: {assessment.passingScore}%</span>
            </div>
          </div>

          {/* Attempt Limits Status */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {maxAttempts > 0
                ? `${attemptsUsed} of ${maxAttempts} attempts used`
                : `${attemptsUsed} attempts taken (Unlimited)`}
            </span>
            {hasInProgress && (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                In Progress
              </span>
            )}
          </div>

          {/* Actions CTA */}
          <div className="pt-1 flex items-center gap-2">
            {hasInProgress ? (
              <Link
                href={`/assessments/${assessment._id}/play`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                Continue Assessment
              </Link>
            ) : attemptsRemaining === 0 ? (
              <Link
                href={`/assessments/${assessment.slug || assessment._id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition"
              >
                Review Results
              </Link>
            ) : (
              <Link
                href={`/assessments/${assessment.slug || assessment._id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
              >
                {attemptsUsed > 0 ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
                  </>
                ) : (
                  <>
                    Start Assessment <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
