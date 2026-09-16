'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../../components/layout/StudentLayout';
import AssessmentPlayer from '../../../../components/assessments/AssessmentPlayer';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchAssessmentById,
  startAssessmentAttempt,
  saveAttemptAnswer,
  submitAssessmentAttempt,
} from '../../../../services/assessmentService';
import { AlertCircle, RefreshCw, Award } from 'lucide-react';

export default function PlayAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const assessmentId = params?.assessmentId;

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize or restore attempt
  const initAttempt = useCallback(async () => {
    if (!assessmentId || !accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const [assData, attemptData] = await Promise.all([
        fetchAssessmentById(assessmentId, accessToken),
        startAssessmentAttempt(assessmentId, accessToken),
      ]);

      setAssessment(assData);
      setAttempt(attemptData.attempt);
      setQuestions(attemptData.questions || []);
      setExpiresAt(attemptData.expiresAt);
    } catch (err) {
      setError(err.message || 'Unable to launch assessment environment.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, accessToken]);

  useEffect(() => {
    initAttempt();
  }, [initAttempt]);

  // Handle Answer Auto-Save
  const handleSaveAnswer = useCallback(
    async (questionId, selectedAnswers) => {
      if (!attempt?._id || !accessToken) return;
      return await saveAttemptAnswer(
        attempt._id,
        { questionId, selectedAnswers },
        accessToken
      );
    },
    [attempt?._id, accessToken]
  );

  // Handle Assessment Submit
  const handleSubmitAttempt = useCallback(async () => {
    if (!attempt?._id || !accessToken) {
      throw new Error('Attempt or session expired');
    }
    return await submitAssessmentAttempt(attempt._id, accessToken);
  }, [attempt?._id, accessToken]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-6xl mx-auto py-8">
          <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 h-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="md:col-span-8 h-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !assessment || !attempt) {
    return (
      <StudentLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Unable to Launch Assessment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'This assessment attempt is not available or has expired.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={initAttempt}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link
              href={`/assessments/${assessmentId}`}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Assessment Details
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <AssessmentPlayer
        assessment={assessment}
        attempt={attempt}
        questions={questions}
        expiresAt={expiresAt}
        onSaveAnswer={handleSaveAnswer}
        onSubmitAttempt={handleSubmitAttempt}
      />
    </StudentLayout>
  );
}
