'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Archive,
  Loader2,
  Users,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export default function CoursesManagementPage() {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, course: null, confirmTitle: '', isDeleting: false, error: null });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && deleteModal.open && !deleteModal.isDeleting) {
        setDeleteModal({ open: false, course: null, confirmTitle: '', isDeleting: false, error: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModal.open, deleteModal.isDeleting]);

  const handleDeleteCourse = async () => {
    if (!deleteModal.course) return;
    if (deleteModal.confirmTitle.trim().toLowerCase() !== deleteModal.course.title.trim().toLowerCase()) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: null }));
    try {
      await adminApi.deleteCourse(deleteModal.course._id, { reason: 'Deleted by administrator from courses table' });
      setCourses((prev) => prev.filter((c) => c._id !== deleteModal.course._id));
      setDeleteModal({ open: false, course: null, confirmTitle: '', isDeleting: false, error: null });
    } catch (err) {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false, error: err.message || 'Failed to delete course' }));
    }
  };

  const fetchCourses = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCourses({
        page,
        limit: 15,
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setCourses(res.data?.courses || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1);
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum Governance</h1>
            <p className="text-xs text-slate-400 mt-1">
              Supervise courses, approve curriculum publications, and manage course lifecycles ({pagination.total} total)
            </p>
          </div>
          <a
            href="/courses/pending"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition self-start sm:self-auto flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review Queue</span>
          </a>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved (Unpublished)</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Course</th>
                  <th className="p-4">Instructor</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Enrollments</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                      Loading curriculum...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No courses found matching criteria.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-7 rounded-md bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                            <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 line-clamp-1">{c.title}</p>
                            <p className="text-[11px] text-slate-500">{c.difficulty} • {c.duration}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {c.instructor?.name || 'Assigned Staff'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {c.category}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                          c.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                          c.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                        {c.publishedByRole && (
                          <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                            by {c.publishedByRole}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {c.enrollmentCount || 0}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <a
                          href={`/courses/${c._id}/review`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Review</span>
                        </a>
                        {hasPermission('courses.publish') && (
                          <button
                            onClick={() => setDeleteModal({ open: true, course: c, confirmTitle: '', isDeleting: false, error: null })}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium transition"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchCourses(pagination.page - 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchCourses(pagination.page + 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Delete Course Confirmation Modal */}
        {deleteModal.open && deleteModal.course && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-course-title"
          >
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 id="admin-delete-course-title" className="text-base font-bold text-white">
                    Delete Course Permanently?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This administrative action permanently removes the course from student discovery, search indices, and recommendations.
                  </p>
                </div>
              </div>

              {/* Course Context & Statistics */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Course:</span>
                  <span className="font-semibold text-white">{deleteModal.course.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-medium text-slate-200">{deleteModal.course.instructor?.name || 'Assigned Staff'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolled Students:</span>
                  <span className="font-medium text-slate-200">{deleteModal.course.enrollmentCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Publication Status:</span>
                  <span className="font-bold uppercase text-[10px] text-amber-400">{deleteModal.course.status}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                <strong>Safety Policy:</strong> Historical credentials and issued student certificates are preserved for portfolio verification.
              </div>

              {deleteModal.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteModal.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs text-slate-400 font-medium">
                  Type <span className="text-rose-400 font-bold select-all">&quot;{deleteModal.course.title}&quot;</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteModal.confirmTitle}
                  onChange={(e) => setDeleteModal({ ...deleteModal, confirmTitle: e.target.value })}
                  placeholder={deleteModal.course.title}
                  disabled={deleteModal.isDeleting}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={deleteModal.isDeleting}
                  onClick={() => setDeleteModal({ open: false, course: null, confirmTitle: '', isDeleting: false, error: null })}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    deleteModal.confirmTitle.trim().toLowerCase() !== deleteModal.course.title.trim().toLowerCase() ||
                    deleteModal.isDeleting
                  }
                  onClick={handleDeleteCourse}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {deleteModal.isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
