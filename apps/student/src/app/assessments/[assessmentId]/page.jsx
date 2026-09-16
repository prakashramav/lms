'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../components/layout/StudentLayout';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchAssessmentById,
  startAssessmentAttempt,
} from '../../../services/assessmentService';
import {
  Clock,
  HelpCircle,
  Award,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Calendar,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const assessmentId = params?.assessmentId;

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-start confirmation dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const loadData = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAssessmentById(assessmentId, accessToken);
      setAssessment(data);
    } catch (err) {
      setError(err.message || 'Assessment not found or unavailable.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle starting attempt
  const handleStartAttempt = async () => {
    if (!accessToken) {
      router.push(`/login?redirect=/assessments/${assessmentId}`);
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      const res = await startAssessmentAttempt(assessment._id, accessToken);
      router.push(`/assessments/${assessment._id}/play`);
    } catch (err) {
      setStartError(err.message || 'Failed to start assessment. Please try again.');
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !assessment) {
    return (
      <StudentLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Assessment Unavailable
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'This assessment could not be loaded.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link
              href="/assessments"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const previousAttempts = assessment.previousAttempts || [];
  const maxAttempts = assessment.maxAttempts || 0;
  const attemptsUsed = assessment.attemptsUsed || 0;
  const canAttempt = assessment.canAttempt;
  const hasInProgress = !!assessment.inProgressAttemptId;

  return (
    <StudentLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                {assessment.type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {assessment.difficulty} Level
              </span>
              {assessment.courseId && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Course: {assessment.courseId.title}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {assessment.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {assessment.description ||
                'Complete this timed assessment to test your understanding of core concepts.'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Questions
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {assessment.questionCount} Questions
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time Limit
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {assessment.duration} Minutes
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Passing Score
              </span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {assessment.passingScore}%
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Max Attempts
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {maxAttempts > 0 ? `${attemptsUsed}/${maxAttempts} Used` : 'Unlimited'}
              </p>
            </div>
          </div>

          {/* CTA Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {hasInProgress ? (
              <Link
                href={`/assessments/${assessment._id}/play`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 transition"
              >
                <PlayCircle className="w-5 h-5" />
                Resume Active Attempt
              </Link>
            ) : canAttempt ? (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition"
              >
                <PlayCircle className="w-5 h-5" />
                {attemptsUsed > 0 ? 'Retake Assessment' : 'Start Assessment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                Maximum attempt limit reached for this assessment.
              </div>
            )}

            <span className="text-xs text-slate-400">
              Evaluated strictly on server • Zero cheating tolerance
            </span>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Assessment Instructions & Guidelines
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
            <p>
              {assessment.instructions ||
                'Read each question carefully and select the best answer before submitting.'}
            </p>
            <ul className="list-disc list-inside space-y-1.5 pt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <li>Once you click <strong>Start Assessment</strong>, the countdown timer begins on the server and cannot be paused.</li>
              <li>Your answers are automatically saved in the background as you select options.</li>
              <li>You can navigate back and forth between questions or flag questions for review.</li>
              <li>If the timer reaches 00:00, your assessment will be submitted automatically with your saved answers.</li>
            </ul>
          </div>
        </div>

        {/* Previous Attempts History Table */}
        {previousAttempts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Your Previous Attempts ({previousAttempts.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 overflow-x-auto">
              {previousAttempts.map((att) => {
                const isPassed = att.passed;
                return (
                  <div
                    key={att._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Attempt #{att.attemptNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPassed
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {isPassed ? 'PASSED' : 'DID NOT PASS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'In Progress'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {att.score} pts ({att.percentage}%)
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {Math.floor((att.timeSpent || 0) / 60)}m {(att.timeSpent || 0) % 60}s spent
                        </p>
                      </div>

                      {att.status === 'SUBMITTED' && (
                        <Link
                          href={`/assessments/${assessment._id}/results/${att._id}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                        >
                          Results
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Confirmation Modal Dialog */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              onClick={() => !isStarting && setIsConfirmOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 z-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Ready to start your assessment?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  You are about to start a <strong>{assessment.duration}-minute</strong> assessment with{' '}
                  <strong>{assessment.questionCount} questions</strong>.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 text-left space-y-1 mt-2">
                  <p>• Once the timer begins, it cannot be paused.</p>
                  <p>• Closing the window will not stop the timer.</p>
                </div>
              </div>

              {startError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {startError}
                </p>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isStarting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartAttempt}
                  disabled={isStarting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isStarting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Starting...
                    </>
                  ) : (
                    'Begin Assessment'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
