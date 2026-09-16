'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import CodeEditor from '@/components/practice/CodeEditor';
import { practiceService } from '@/services/practiceService';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Cpu,
} from 'lucide-react';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!submissionId) return;

    const fetchSubmission = async () => {
      setLoading(true);
      try {
        const res = await practiceService.getSubmissionDetail(submissionId);
        setSubmission(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !submission) {
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Submission Unavailable
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'Unable to access this submission.'}
          </p>
          <Link
            href="/practice/submissions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Submissions
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const isAccepted = submission.verdict === 'ACCEPTED';

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/practice/submissions"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Submission Report</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  #{submission._id.slice(-6)}
                </span>
              </h1>
              <div className="text-xs text-slate-500 mt-0.5">
                Problem:{' '}
                <Link
                  href={`/practice/problems/${submission.problemId?.slug}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {submission.problemId?.title}
                </Link>
              </div>
            </div>
          </div>

          <Link
            href={`/practice/problems/${submission.problemId?.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Link>
        </div>

        {/* Verdict Banner Card */}
        <div
          className={`rounded-xl border p-5 ${
            isAccepted
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isAccepted ? (
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-500 text-white">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="text-lg font-bold">{submission.verdict}</div>
                <div className="text-xs opacity-80">
                  Passed {submission.passedTests} of {submission.totalTests} test cases (Score:{' '}
                  {submission.score}%)
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-1.5 opacity-90">
                <Clock className="w-4 h-4" />
                <span>{submission.executionTime} ms</span>
              </div>
              {submission.memoryUsed > 0 && (
                <div className="flex items-center gap-1.5 opacity-90">
                  <Cpu className="w-4 h-4" />
                  <span>{Math.round(submission.memoryUsed / 1024)} MB</span>
                </div>
              )}
              <div className="font-mono opacity-80 uppercase text-[11px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded">
                {submission.language}
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Code Viewer */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Submitted Code ({submission.language})
          </div>
          <div className="h-96">
            <CodeEditor
              code={submission.code}
              language={submission.language}
              readOnly={true}
              height="100%"
            />
          </div>
        </div>

        {/* Test Case Results Breakdown */}
        {submission.testResults && submission.testResults.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evaluated Test Cases ({submission.testResults.length})
            </div>
            <div className="space-y-2">
              {submission.testResults.map((tr, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs ${
                    tr.passed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-semibold">
                    <span className="flex items-center gap-1.5">
                      {tr.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      Test Case {idx + 1} {tr.isHidden ? '(Hidden)' : ''}
                    </span>
                    {tr.executionTime !== undefined && (
                      <span className="text-[11px] font-normal text-slate-400">
                        {tr.executionTime} ms
                      </span>
                    )}
                  </div>
                  {tr.actualOutput && (
                    <div className="mt-1 text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Output:{' '}
                      </span>
                      <code className="font-mono text-slate-900 dark:text-slate-100">
                        {tr.actualOutput}
                      </code>
                    </div>
                  )}
                  {tr.errorMessage && (
                    <div className="mt-1 text-rose-600 dark:text-rose-400 text-[11px]">
                      {tr.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
