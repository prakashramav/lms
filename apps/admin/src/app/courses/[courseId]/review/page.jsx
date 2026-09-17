'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../../components/AdminLayout';
import { adminApi } from '../../../../services/adminApi';
import { useAuth } from '../../../../context/AuthContext';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  XCircle,
  UploadCloud,
  EyeOff,
  Archive,
  Flag,
  Calendar,
  User,
  Layers,
  FileText,
  Award,
  Code,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function CourseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId;
  const { hasPermission } = useAuth();

  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals for reason-based actions
  const [rejectionModal, setRejectionModal] = useState({ open: false, reason: '' });
  const [flagModal, setFlagModal] = useState({ open: false, reason: '' });

  const fetchReview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCourseReview(courseId);
      setReviewData(res.data);
    } catch (err) {
      console.error('Failed to load course review:', err);
      setError(err.message || 'Failed to fetch course details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchReview();
  }, [courseId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApi.approveCourse(courseId);
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to approve course');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await adminApi.publishCourse(courseId);
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to publish course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    const reason = prompt('Reason for unpublishing this course:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await adminApi.unpublishCourse(courseId, { reason });
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to unpublish course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this course? It will be retired from public discovery.')) return;
    setActionLoading(true);
    try {
      await adminApi.archiveCourse(courseId);
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to archive course');
    } finally {
      setActionLoading(false);
    }
  };

  const submitRejection = async () => {
    setActionLoading(true);
    try {
      await adminApi.rejectCourse(courseId, { reason: rejectionModal.reason });
      setRejectionModal({ open: false, reason: '' });
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to reject course');
    } finally {
      setActionLoading(false);
    }
  };

  const submitFlag = async () => {
    setActionLoading(true);
    try {
      await adminApi.flagCourse(courseId, { reason: flagModal.reason });
      setFlagModal({ open: false, reason: '' });
      await fetchReview();
    } catch (err) {
      alert(err.message || 'Failed to flag course content');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading course curriculum preview...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !reviewData) {
    return (
      <AdminLayout>
        <div className="py-12 space-y-4">
          <button onClick={() => router.push('/courses')} className="text-xs text-indigo-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </button>
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error || 'Course not found'}</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { course, modules, assessments, codingProblems, stats } = reviewData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.push('/courses')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </button>

        {/* Course Header with Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-16 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white">{course.title}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  course.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' :
                  course.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                  course.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                  course.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {course.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{course.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                <span>Instructor: <strong className="text-slate-300">{course.instructor?.name}</strong></span>
                <span>Category: <strong className="text-slate-300">{course.category}</strong></span>
                <span>Difficulty: <strong className="text-slate-300">{course.difficulty}</strong></span>
                <span>Duration: <strong className="text-slate-300">{course.duration}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {hasPermission('courses.approve') && course.status === 'PENDING_REVIEW' && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Course</span>
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => setRejectionModal({ open: true, reason: '' })}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Course</span>
                </button>
              </>
            )}

            {hasPermission('courses.publish') && course.status === 'APPROVED' && (
              <button
                disabled={actionLoading}
                onClick={handlePublish}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Publish to Catalog</span>
              </button>
            )}

            {hasPermission('courses.publish') && course.status === 'PUBLISHED' && (
              <button
                disabled={actionLoading}
                onClick={handleUnpublish}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            )}

            {hasPermission('courses.publish') && course.status !== 'ARCHIVED' && (
              <button
                disabled={actionLoading}
                onClick={handleArchive}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Archive Course"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            {hasPermission('courses.review') && (
              <button
                disabled={actionLoading}
                onClick={() => setFlagModal({ open: true, reason: '' })}
                className="px-3 py-2 bg-rose-950/40 border border-rose-800/80 text-rose-300 hover:bg-rose-900/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Flag Content</span>
              </button>
            )}
          </div>
        </div>

        {/* Rejection Note Warning if applicable */}
        {course.rejectionReason && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-xs text-rose-300">
            <strong className="block mb-0.5">Faculty Feedback / Rejection Note:</strong>
            {course.rejectionReason}
          </div>
        )}

        {/* Modules & Lessons Hierarchy Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Curriculum Modules & Lessons ({modules.length} Modules)</h2>
          </div>

          {modules.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No modules published under this course.</p>
          ) : (
            <div className="space-y-4">
              {modules.map((m) => (
                <div key={m._id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200">{m.title}</h3>
                    <span className="text-[10px] text-slate-500">{m.lessons?.length || 0} Lessons</span>
                  </div>
                  {m.description && <p className="text-[11px] text-slate-400">{m.description}</p>}

                  <div className="pt-2 space-y-1.5">
                    {m.lessons?.map((l) => (
                      <div key={l._id} className="p-2 bg-slate-900 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-200 font-medium">{l.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{l.type}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{l.duration} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {rejectionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Reject Course Submission</h3>
              <p className="text-xs text-slate-400">
                Provide constructive curriculum feedback for the instructor explaining why the course cannot be approved.
              </p>
              <textarea
                rows={3}
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="E.g. Incomplete assessment test cases, audio quality in Module 1..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectionModal({ open: false, reason: '' })}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionModal.reason.trim() || actionLoading}
                  onClick={submitRejection}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flag Content Modal */}
        {flagModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Flag Course Content</h3>
              <p className="text-xs text-slate-400">
                Flag this course for administrative review (e.g. copyright concern, spam, or broken resources).
              </p>
              <textarea
                rows={3}
                value={flagModal.reason}
                onChange={(e) => setFlagModal({ ...flagModal, reason: e.target.value })}
                placeholder="Reason for flag..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setFlagModal({ open: false, reason: '' })}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!flagModal.reason.trim() || actionLoading}
                  onClick={submitFlag}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                >
                  Submit Content Flag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
