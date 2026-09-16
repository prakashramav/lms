'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../components/layout/StudentLayout';
import CurriculumAccordion from '../../../components/courses/CurriculumAccordion';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchCourseBySlug,
  fetchEnrollmentByCourse,
  enrollInCourse,
} from '../../../services/courseService';
import {
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  PlayCircle,
  Sparkles,
  HelpCircle,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const slug = params?.slug;

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  // Load course details & enrollment status
  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const courseData = await fetchCourseBySlug(slug, accessToken);
      setCourse(courseData);

      if (accessToken && courseData?._id) {
        try {
          const enr = await fetchEnrollmentByCourse(courseData._id, accessToken);
          setEnrollment(enr);
        } catch {
          setEnrollment(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Course unavailable.');
    } finally {
      setLoading(false);
    }
  }, [slug, accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Enrollment
  const handleEnroll = async () => {
    if (!accessToken) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (!course?._id) return;
    setEnrolling(true);

    try {
      const newEnrollment = await enrollInCourse(course._id, accessToken);
      setEnrollment(newEnrollment);
      // Directly transition into learning environment
      router.push(`/learning/${course._id}`);
    } catch (err) {
      alert(err.message || 'Failed to enroll in course');
      setEnrolling(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-5xl mx-auto py-8">
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
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
            Course Unavailable
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'This course could not be found or has not been published.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link
              href="/learning"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'COMPLETED' || enrollment?.progressPercentage === 100;
  const totalModules = course.modules?.length || 0;
  const totalLessons = (course.modules || []).reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0
  );

  const faqs = [
    {
      q: 'Will I get access to all module resources immediately?',
      a: 'Yes, upon enrollment you have full access to study materials, lesson videos, source files, and articles included in the curriculum.',
    },
    {
      q: 'How does lesson progress get tracked?',
      a: 'Your progress is synchronized automatically to your student account. Videos save playback position so you can resume anytime from any device.',
    },
    {
      q: 'Can I revisit completed lessons?',
      a: 'Absolutely. You retain permanent access to all curriculum modules and lessons to review concepts whenever you like.',
    },
  ];

  return (
    <StudentLayout>
      <div className="space-y-10 max-w-6xl mx-auto pb-12">
        {/* Course Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Col: Course Info & CTA */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-400/30 uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
                  {course.difficulty} Level
                </span>
                {course.duration && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                {course.shortDescription || course.description}
              </p>

              {/* Instructor & Meta */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-brand-600/30 border border-brand-400/40 flex items-center justify-center text-sm font-bold text-brand-300">
                  {course.instructor?.name ? course.instructor.name.charAt(0) : 'I'}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Taught by</p>
                  <p className="text-sm font-bold text-white">
                    {course.instructor?.name || 'Senior Staff Engineer'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                {isEnrolled ? (
                  <Link
                    href={`/learning/${course._id}`}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {isCompleted ? 'Review Course' : 'Continue Learning'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {enrolling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Enrolling...
                      </>
                    ) : (
                      <>
                        Enroll Now <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Full Lifetime Access & Certificate Track
                </div>
              </div>
            </div>

            {/* Right Col: Course Thumbnail Card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-56 lg:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-56 lg:h-64 flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 to-indigo-900 text-white p-6 text-center">
                  <BookOpen className="w-12 h-12 text-white/50 mb-2" />
                  <span className="font-bold text-sm">{course.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid: Left Column (Content) + Right Column (Sidebar Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 spans) */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  What You&apos;ll Learn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Course Description */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Course Description
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {course.description || course.shortDescription}
              </div>
            </div>

            {/* Curriculum Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Course Curriculum
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {totalModules} modules • {totalLessons} total lessons
                  </p>
                </div>
                {!isEnrolled && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Enroll to unlock all lessons
                  </div>
                )}
              </div>

              {/* Curriculum Accordion */}
              <div className="pt-2">
                <CurriculumAccordion
                  modules={course.modules || []}
                  isEnrolled={isEnrolled}
                  onSelectLesson={(lesson) => {
                    if (isEnrolled || lesson.isPreview) {
                      router.push(`/learning/${course._id}?lessonId=${lesson._id}`);
                    }
                  }}
                />
              </div>
            </div>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Prerequisites & Requirements
                </h3>
                <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {course.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAQs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Frequently Asked Questions
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 pt-2">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      <span>{faq.q}</span>
                      {activeFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    {activeFaq === idx && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary Box */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Track Overview
              </h4>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Duration
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {course.duration || 'Self-paced'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Modules
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalModules} Modules
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" /> Total Lessons
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalLessons} Lessons
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> Access
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Lifetime
                  </span>
                </div>
              </div>

              {/* Skills Tags */}
              {course.skills && course.skills.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Skills Covered
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {course.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor Card */}
              {course.instructor && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                      {course.instructor.name ? course.instructor.name.charAt(0) : 'I'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {course.instructor.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {course.instructor.title || 'Course Creator'}
                      </p>
                    </div>
                  </div>
                  {course.instructor.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              )}

              {/* Enrollment CTA */}
              <div className="pt-2">
                {isEnrolled ? (
                  <Link
                    href={`/learning/${course._id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {isCompleted ? 'Review Course' : 'Continue Learning'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
