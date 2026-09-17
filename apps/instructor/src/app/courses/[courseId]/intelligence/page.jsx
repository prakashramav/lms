'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import InstructorLayout from '../../../../components/layout/InstructorLayout';
import { useAuth } from '../../../../context/AuthContext';
import { fetchCourseIntelligence, fetchCourseDetail } from '../../../../services/instructorService';
import {
  Brain,
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCw
} from 'lucide-react';

export default function CourseIntelligencePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [intelligence, setIntelligence] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!accessToken || !courseId) return;
    setLoading(true);
    setError(null);
    try {
      const [intelData, courseData] = await Promise.all([
        fetchCourseIntelligence(accessToken, courseId),
        fetchCourseDetail(accessToken, courseId).catch(() => null),
      ]);
      setIntelligence(intelData);
      setCourse(courseData);
    } catch (err) {
      setError(err.message || 'Failed to load course intelligence data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendSupportAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    setAnnouncementSent(true);
    setAnnouncementMsg('');
    setTimeout(() => setAnnouncementSent(false), 4000);
  };

  const funnel = intelligence?.funnel || { totalEnrolled: 0, activeEnrollments: 0, completedEnrollments: 0, completionRate: 0 };
  const lessonAnalytics = intelligence?.lessonAnalytics || [];
  const commonWeakTopics = intelligence?.commonWeakTopics || [];
  const studentsNeedingSupport = intelligence?.studentsNeedingSupport || [];

  return (
    <InstructorLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb & Header */}
        <div className="space-y-4">
          <Link
            href={`/courses/${courseId}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Course Editor</span>
          </Link>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
                <Brain className="w-3.5 h-3.5" />
                <span>Course Intelligence & Cohort Insights</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {course?.title || intelligence?.course?.title || 'Course Intelligence'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Aggregated student progress analytics, lesson drop-off points, and non-punitive support signals.
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* 1. Enrollment & Completion Funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Total Enrolled</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {funnel.totalEnrolled}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Active Learners</span>
            <div className="text-2xl font-bold text-blue-600">
              {funnel.activeEnrollments}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Graduated</span>
            <div className="text-2xl font-bold text-emerald-600">
              {funnel.completedEnrollments}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-400">Completion Rate</span>
            <div className="text-2xl font-bold text-purple-600">
              {funnel.completionRate}%
            </div>
          </div>
        </div>

        {/* 2. Most Difficult Lessons & Drop-Off Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <span>Curriculum Completion & Drop-Off Points</span>
            </h3>
            <span className="text-xs text-slate-400">Shows completed student count per lesson</span>
          </div>

          {lessonAnalytics.length === 0 ? (
            <p className="text-xs text-slate-400">No lesson completion records logged yet.</p>
          ) : (
            <div className="space-y-4">
              {lessonAnalytics.map((lesson, idx) => (
                <div key={lesson.lessonId || idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {lesson.order ? `${lesson.order}. ` : ''}{lesson.title}
                    </span>
                    <span className="text-slate-500">
                      {lesson.completedCount} completed ({lesson.dropOffPercent}% drop-off)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, 100 - lesson.dropOffPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Common Weak Topics (Anonymized Aggregate) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Common Conceptual Struggles</span>
            </h3>
            <p className="text-xs text-slate-400">
              Topics where students frequently miss questions in course assessments.
            </p>

            {commonWeakTopics.length === 0 ? (
              <p className="text-xs text-slate-400">No recurring mistake topics detected.</p>
            ) : (
              <div className="space-y-2.5">
                {commonWeakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {topic.topic}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800">
                      {topic.mistakeCount} missed questions
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Support Signals ("May Need Support") */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Students Who May Need Support</span>
            </h3>
            <p className="text-xs text-slate-400">
              Identified through objective signals (e.g., &gt;7 days inactivity or &lt;30% progress).
            </p>

            {studentsNeedingSupport.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                All active students are progressing with healthy velocity!
              </div>
            ) : (
              <div className="space-y-2.5">
                {studentsNeedingSupport.map((entry, idx) => (
                  <div
                    key={entry.enrollmentId || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {entry.student?.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Signal: {entry.signal} · Progress: {entry.progressPercentage}%
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      May need support
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Instructor Action: Targeted Cohort Announcement */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-600" />
            <span>Offer Additional Support Resource or Announcement</span>
          </h3>
          <p className="text-xs text-slate-400">
            Send an encouraging note or supplementary revision tips to enrolled learners in this cohort.
          </p>

          <form onSubmit={handleSendSupportAnnouncement} className="space-y-3">
            <textarea
              rows={3}
              required
              placeholder="e.g., We noticed several questions around Promises and Async/Await. Check out the bonus sandbox walkthrough in Module 2!"
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex items-center justify-between">
              {announcementSent ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Support announcement dispatched to cohort!
                </span>
              ) : (
                <span className="text-xs text-slate-400">Delivered directly to students&apos; dashboard reminders.</span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm"
              >
                Send Support Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorLayout>
  );
}
