'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InstructorLayout from '../../../components/layout/InstructorLayout';
import { useAuth } from '../../../context/AuthContext';
import { fetchStudentDetail } from '../../../services/instructorService';
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle2,
  Award,
  Code2,
  Clock,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { accessToken } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken || !courseId || !studentId) {
      setIsLoading(false);
      return;
    }
    fetchStudentDetail(accessToken, courseId, studentId)
      .then((data) => setStudentData(data))
      .catch((err) => setError(err.message || 'Failed to load student progress'))
      .finally(() => setIsLoading(false));
  }, [accessToken, courseId, studentId]);

  if (isLoading) {
    return (
      <InstructorLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-slate-900 rounded-2xl" />
          <div className="h-64 bg-slate-900 rounded-2xl" />
        </div>
      </InstructorLayout>
    );
  }

  if (error || !studentData) {
    return (
      <InstructorLayout>
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Student Record Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {error || 'Unable to locate student progress records for this course.'}
          </p>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cohort</span>
          </Link>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cohort</span>
          </Link>
          <span className="text-xs text-slate-400">
            Student Telemetry (Privacy Protected)
          </span>
        </div>

        {/* STUDENT PROFILE CARD */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-xl">
              {studentData.student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {studentData.student?.name || 'Student'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {studentData.enrollment?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{studentData.student?.email}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Course: <span className="text-slate-300 font-semibold">{studentData.course?.title}</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="text-xs uppercase text-slate-500 font-bold">Course Completion</span>
            <div className="text-3xl font-extrabold text-teal-400 mt-0.5">
              {studentData.enrollment?.progress || 0}%
            </div>
          </div>
        </div>

        {/* PROGRESS METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Lessons Completed</span>
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {studentData.enrollment?.completedLessons?.length || 0}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Assessments Taken</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {studentData.submissions?.length || 0}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Last Active</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-semibold text-white mt-2">
              {studentData.enrollment?.updatedAt
                ? new Date(studentData.enrollment.updatedAt).toLocaleDateString()
                : 'Recent'}
            </p>
          </div>
        </div>

        {/* RECENT SUBMISSION RESULTS */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" />
            <span>Assessment &amp; Quiz Results</span>
          </h3>

          {(!studentData.submissions || studentData.submissions.length === 0) ? (
            <p className="text-xs text-slate-500">No quiz submissions recorded yet for this course.</p>
          ) : (
            <div className="space-y-2">
              {studentData.submissions.map((sub, idx) => (
                <div
                  key={sub._id || idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">
                      {sub.assessmentTitle || 'Assessment Attempt'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-400">{sub.score || 0}%</span>
                    <span className="block text-[10px] text-slate-500">
                      {sub.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
