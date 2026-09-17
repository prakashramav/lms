'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import {
  GraduationCap,
  BookOpen,
  Award,
  Code,
  ArrowLeft,
  CheckCircle,
  Clock,
  Ban,
  Activity,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.studentId;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getStudentDetail(studentId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student detail:', err);
      setError(err.message || 'Failed to fetch student record');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchStudentData();
  }, [studentId]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading student operational telemetry...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="py-12 space-y-4">
          <button onClick={() => router.push('/students')} className="text-xs text-indigo-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
          </button>
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error || 'Student record not found'}</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { student, enrollments, assessmentAttempts, codingSubmissions, stats } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => router.push('/students')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students</span>
        </button>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-2xl flex items-center justify-center shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white">{student.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  student.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{student.email}</p>
              <div className="flex items-center space-x-4 text-slate-500 text-[11px] mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Enrolled {new Date(student.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Last Active: {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Mini-Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Courses</span>
              <p className="text-lg font-bold text-white mt-0.5">{stats.totalEnrollments}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Completed</span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{stats.completedEnrollments}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Quizzes</span>
              <p className="text-lg font-bold text-indigo-400 mt-0.5">{stats.totalAssessmentAttempts}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Problems</span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{stats.totalCodingSubmissions}</p>
            </div>
          </div>
        </div>

        {/* 2-Column: Course Enrollments & Assessment Attempts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Enrollments */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Course Enrollments ({enrollments.length})</h2>
            </div>

            {enrollments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No course enrollments recorded.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((e) => (
                  <div key={e._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-200">{e.courseId?.title || 'Course'}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {e.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${e.progressPercentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Progress: {e.progressPercentage || 0}%</span>
                      <span>Enrolled: {new Date(e.enrolledAt || e.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Quiz & Assessment History</h2>
            </div>

            {assessmentAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No assessment submissions recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {assessmentAttempts.map((a) => (
                  <div key={a._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{a.assessmentId?.title || 'Assessment'}</p>
                      <p className="text-[11px] text-slate-500">
                        Score: {a.percentage}% • Attempt #{a.attemptNumber}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      a.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {a.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coding Activity Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Code className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Coding Arena Practice Telemetry</h2>
          </div>

          {codingSubmissions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No online judge submissions recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Problem</th>
                    <th className="pb-2">Language</th>
                    <th className="pb-2">Verdict</th>
                    <th className="pb-2">Execution Time</th>
                    <th className="pb-2">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {codingSubmissions.map((sub) => (
                    <tr key={sub._id}>
                      <td className="py-2.5 font-medium text-slate-200">{sub.problemId?.title || 'Challenge'}</td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">{sub.language}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sub.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{sub.executionTime || 12} ms</td>
                      <td className="py-2.5 text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
