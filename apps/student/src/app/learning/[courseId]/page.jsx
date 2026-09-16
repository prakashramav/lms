'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../components/layout/StudentLayout';
import CurriculumAccordion from '../../../components/courses/CurriculumAccordion';
import LessonPlayer from '../../../components/player/LessonPlayer';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchCourseCurriculum,
  fetchEnrollmentByCourse,
  fetchCourseProgress,
  startLessonProgress,
  updateLessonProgress,
  completeLessonProgress,
  fetchBookmarks,
  toggleBookmark,
} from '../../../services/courseService';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Menu,
  X,
  BookOpen,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function LearningEnvironmentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const courseId = params?.courseId;
  const initialLessonId = searchParams?.get('lessonId');

  // State
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mobile curriculum drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Flattened ordered lessons for Previous/Next computation
  const orderedLessons = useMemo(() => {
    const list = [];
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedModules.forEach((mod) => {
      const sortedLessons = [...(mod.lessons || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedLessons.forEach((les) => {
        list.push({ ...les, moduleTitle: mod.title, moduleOrder: mod.order });
      });
    });
    return list;
  }, [modules]);

  // Current lesson index
  const currentIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return orderedLessons.findIndex((l) => l._id === activeLesson._id);
  }, [orderedLessons, activeLesson]);

  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  // Completed lesson IDs set
  const completedLessonIds = useMemo(() => {
    if (!progressData?.progress) return [];
    return progressData.progress.filter((p) => p.isCompleted).map((p) => p.lessonId);
  }, [progressData]);

  // Progress for active lesson
  const activeLessonProgress = useMemo(() => {
    if (!progressData?.progress || !activeLesson) return null;
    return progressData.progress.find((p) => p.lessonId === activeLesson._id) || null;
  }, [progressData, activeLesson]);

  // Load course, curriculum, enrollment, and progress
  const loadLearningData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);

    try {
      const curriculumData = await fetchCourseCurriculum(courseId, accessToken);
      setCourse(curriculumData.course);
      setModules(curriculumData.modules || []);

      // Flatten lessons to pick active lesson
      const allLessons = [];
      (curriculumData.modules || []).forEach((m) => {
        (m.lessons || []).forEach((l) => allLessons.push(l));
      });

      if (accessToken) {
        // Fetch enrollment & progress in parallel
        const [enr, prog, bms] = await Promise.all([
          fetchEnrollmentByCourse(courseId, accessToken).catch(() => null),
          fetchCourseProgress(courseId, accessToken).catch(() => null),
          fetchBookmarks(accessToken).catch(() => []),
        ]);

        setEnrollment(enr);
        setProgressData(prog);
        setBookmarkedLessonIds((bms || []).map((b) => (typeof b.lessonId === 'object' ? b.lessonId._id : b.lessonId)));

        // Select active lesson: URL param > lastLessonId from enrollment > first unlocked lesson
        let chosenLesson = null;
        if (initialLessonId) {
          chosenLesson = allLessons.find((l) => l._id === initialLessonId);
        }
        if (!chosenLesson && enr?.lastLessonId) {
          chosenLesson = allLessons.find((l) => l._id === enr.lastLessonId);
        }
        if (!chosenLesson && allLessons.length > 0) {
          chosenLesson = allLessons[0];
        }
        setActiveLesson(chosenLesson);

        // Signal lesson start to backend if authenticated
        if (chosenLesson?._id && enr) {
          startLessonProgress(chosenLesson._id, accessToken).catch(() => {});
        }
      } else {
        // Unauthenticated visitor: can only preview previewable lessons
        const firstPreview = allLessons.find((l) => l.isPreview) || allLessons[0];
        setActiveLesson(firstPreview);
      }
    } catch (err) {
      setError(err.message || 'Unable to load learning environment.');
    } finally {
      setLoading(false);
    }
  }, [courseId, accessToken, initialLessonId]);

  useEffect(() => {
    loadLearningData();
  }, [loadLearningData]);

  // Handle Lesson Selection
  const handleSelectLesson = async (lesson) => {
    setActiveLesson(lesson);
    setIsMobileDrawerOpen(false);

    if (accessToken && enrollment && lesson?._id) {
      try {
        await startLessonProgress(lesson._id, accessToken);
      } catch {
        // Non-fatal
      }
    }
  };

  // Handle Position Update
  const handleUpdatePosition = useCallback(
    async (lastPosition) => {
      if (!accessToken || !activeLesson?._id || !enrollment) return;
      try {
        await updateLessonProgress(activeLesson._id, { lastPosition }, accessToken);
      } catch {
        // Silent background update error
      }
    },
    [accessToken, activeLesson?._id, enrollment]
  );

  // Handle Mark Complete
  const handleMarkComplete = async () => {
    if (!accessToken || !activeLesson?._id || !enrollment) return;

    try {
      const result = await completeLessonProgress(activeLesson._id, accessToken);

      // Refresh progress data
      const updatedProg = await fetchCourseProgress(courseId, accessToken);
      setProgressData(updatedProg);

      // Refresh enrollment progress
      const updatedEnr = await fetchEnrollmentByCourse(courseId, accessToken);
      setEnrollment(updatedEnr);

      // Auto-advance to next lesson if available
      if (nextLesson) {
        handleSelectLesson(nextLesson);
      }
    } catch (err) {
      alert(err.message || 'Failed to mark lesson complete');
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async () => {
    if (!accessToken || !activeLesson?._id) return;
    try {
      const res = await toggleBookmark(activeLesson._id, accessToken);
      if (res.bookmarked) {
        setBookmarkedLessonIds((prev) => [...prev, activeLesson._id]);
      } else {
        setBookmarkedLessonIds((prev) => prev.filter((id) => id !== activeLesson._id));
      }
    } catch (err) {
      alert(err.message || 'Failed to update bookmark');
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-7xl mx-auto py-6">
          <div className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div className="aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Lesson Unavailable
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'The requested course could not be loaded.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadLearningData}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link
              href="/learning"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const isEnrolled = !!enrollment;
  const progressPercentage = enrollment?.progressPercentage ?? 0;
  const isLessonLocked = !isEnrolled && !activeLesson?.isPreview;
  const isCurrentCompleted = completedLessonIds.includes(activeLesson?._id);
  const isCurrentBookmarked = bookmarkedLessonIds.includes(activeLesson?._id);

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* 1. Course Header & Navigation Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/courses/${course.slug}`}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition flex-shrink-0"
              title="Back to Course Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {course.difficulty} Track
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {course.title}
              </h1>
            </div>
          </div>

          {/* Progress Bar & Mobile Drawer Button */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {isEnrolled && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {progressPercentage}% Complete
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {completedLessonIds.length} of {orderedLessons.length} lessons
                  </p>
                </div>
                <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mobile Curriculum Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              <Menu className="w-4 h-4" />
              Curriculum
            </button>
          </div>
        </div>

        {/* 2. Main Desktop Workspace: Left Content (70%) + Right Curriculum (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Player & Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {isLessonLocked ? (
              /* Locked Lesson Prompt */
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Enroll to Unlock This Lesson
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This lesson is part of the full curriculum. Enroll in the course to gain
                    immediate access to all videos, interactive readings, and downloadable files.
                  </p>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition"
                >
                  Enroll in Course
                </Link>
              </div>
            ) : (
              /* Active Lesson Player */
              <LessonPlayer
                lesson={activeLesson}
                progress={activeLessonProgress}
                isBookmarked={isCurrentBookmarked}
                onToggleBookmark={handleToggleBookmark}
                onUpdatePosition={handleUpdatePosition}
                onMarkComplete={handleMarkComplete}
                isCompleted={isCurrentCompleted}
              />
            )}

            {/* Bottom Navigation Toolbar: Previous / Mark Complete / Next */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                disabled={!prevLesson}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous Lesson</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {/* Central Quick Complete */}
              {isEnrolled && !isLessonLocked && (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    isCurrentCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCurrentCompleted ? 'Completed' : 'Mark as Done'}
                </button>
              )}

              <button
                type="button"
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                disabled={!nextLesson}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
              >
                <span className="hidden sm:inline">Next Lesson</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Curriculum Sidebar (hidden on mobile, visible lg+) */}
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Curriculum Modules
                </h3>
                <span className="text-xs text-slate-400">
                  {completedLessonIds.length}/{orderedLessons.length} Done
                </span>
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                <CurriculumAccordion
                  modules={modules}
                  activeLessonId={activeLesson?._id}
                  completedLessonIds={completedLessonIds}
                  onSelectLesson={handleSelectLesson}
                  isEnrolled={isEnrolled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Mobile Curriculum Slide-Over Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Course Curriculum
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <CurriculumAccordion
                  modules={modules}
                  activeLessonId={activeLesson?._id}
                  completedLessonIds={completedLessonIds}
                  onSelectLesson={handleSelectLesson}
                  isEnrolled={isEnrolled}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
