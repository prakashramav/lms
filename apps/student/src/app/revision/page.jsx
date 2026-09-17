'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchRevisionQueue, completeRevisionTopic } from '../../services/intelligenceService';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Brain,
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react';

export default function RevisionPage() {
  const { accessToken } = useAuth();
  const [revisionData, setRevisionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  const loadRevision = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRevisionQueue(accessToken);
      setRevisionData(data);
    } catch (err) {
      setError(err.message || 'Failed to load revision queue.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadRevision();
  }, [loadRevision]);

  const handleComplete = async (reviewId, performance) => {
    setProcessingId(reviewId);
    try {
      await completeRevisionTopic(accessToken, reviewId, performance);
      loadRevision();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const dueReviews = revisionData?.dueReviews || [];
  const upcomingReviews = revisionData?.upcomingReviews || [];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-3">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Spaced Repetition Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Smart Topic Revision
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Reinforce knowledge through scheduled review intervals (1d → 3d → 7d → 14d → 30d).
            </p>
          </div>

          <Link
            href="/ai-tutor?prompt=Teach me what I struggled with in my recent assessments"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Revision Assistant</span>
          </Link>
        </div>

        {/* Due Now Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Ready for Review</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                {dueReviews.length} due
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading revision queue...</div>
          ) : error ? (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : dueReviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No topics currently due for review. Check back later as spaced repetition schedules mature.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dueReviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Interval: {review.intervalDays || 1} day(s)</span>
                      <span>Review count: {review.reviewCount || 0}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {review.topic}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      How confident do you feel on this topic?
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        disabled={processingId === review._id}
                        onClick={() => handleComplete(review._id, 'NEEDS_PRACTICE')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 transition"
                      >
                        Needs Practice
                      </button>
                      <button
                        disabled={processingId === review._id}
                        onClick={() => handleComplete(review._id, 'GOOD')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 transition"
                      >
                        Good
                      </button>
                      <button
                        disabled={processingId === review._id}
                        onClick={() => handleComplete(review._id, 'EASY')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 transition"
                      >
                        Easy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reviews */}
        {upcomingReviews.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upcoming Scheduled Reviews
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
              {upcomingReviews.map((item) => (
                <div key={item._id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.topic}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scheduled for {new Date(item.nextReview).toLocaleDateString()} · Interval: {item.intervalDays} days
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scientific Disclaimer & Transparency */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
          <Brain className="w-4 h-4 text-purple-500 shrink-0" />
          <span>
            The review queue uses a straightforward, explainable spacing progression based on your performance. It helps pace practice without making scientifically unproven memory claims.
          </span>
        </div>
      </div>
    </StudentLayout>
  );
}
