'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import { useAuth } from '../../../context/AuthContext';
import {
  Briefcase,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  Ban,
  ArrowLeft,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instructorId = params?.instructorId;
  const { hasPermission } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchInstructorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getInstructorDetail(instructorId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load instructor detail:', err);
      setError(err.message || 'Failed to fetch instructor record');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (instructorId) fetchInstructorData();
  }, [instructorId]);

  const handleApprove = async () => {
    if (!confirm('Approve this instructor account?')) return;
    setActionLoading(true);
    try {
      await adminApi.approveInstructor(instructorId);
      await fetchInstructorData();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Please specify reason for suspending this instructor:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await adminApi.suspendInstructor(instructorId, { reason });
      await fetchInstructorData();
    } catch (err) {
      alert(err.message || 'Failed to suspend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await adminApi.activateInstructor(instructorId);
      await fetchInstructorData();
    } catch (err) {
      alert(err.message || 'Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading faculty operational record...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="py-12 space-y-4">
          <button onClick={() => router.push('/instructors')} className="text-xs text-indigo-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty
          </button>
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error || 'Instructor not found'}</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { instructor, courses, stats } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.push('/instructors')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Instructors</span>
        </button>

        {/* Profile Card with Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-bold text-2xl flex items-center justify-center shrink-0">
              {instructor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white">{instructor.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  instructor.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                  instructor.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {instructor.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{instructor.email}</p>
              <div className="flex items-center space-x-4 text-slate-500 text-[11px] mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Applied on {new Date(instructor.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            {instructor.status === 'PENDING' && hasPermission('instructors.approve') && (
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Instructor</span>
              </button>
            )}
            {instructor.status === 'ACTIVE' && hasPermission('users.suspend') && (
              <button
                disabled={actionLoading}
                onClick={handleSuspend}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Suspend Instructor</span>
              </button>
            )}
            {instructor.status === 'SUSPENDED' && hasPermission('users.suspend') && (
              <button
                disabled={actionLoading}
                onClick={handleActivate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Reactivate Instructor</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Counter Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Authored Courses</span>
            <p className="text-xl font-bold text-white mt-1">{stats.totalCourses}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Published Courses</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{stats.publishedCourses}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Courses in Review</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{stats.pendingCourses}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">Students Reached</span>
            <p className="text-xl font-bold text-cyan-400 mt-1">{stats.totalStudents}</p>
          </div>
        </div>

        {/* Courses Authored List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Curriculum Portfolio ({courses.length})</h2>
          </div>

          {courses.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Instructor has not authored any courses yet.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((c) => (
                <div
                  key={c._id}
                  className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{c.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.category} • {c.difficulty} • Created {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {c.status}
                    </span>
                    <a
                      href={`/courses/${c._id}/review`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Review
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
