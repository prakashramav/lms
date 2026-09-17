'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import {
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function PendingCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPendingCourses();
      setCourses(res.data?.courses || []);
    } catch (err) {
      console.error('Failed to load pending courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <a href="/courses" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </a>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Course Approval Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Carefully review curriculum structures, lesson content, assessments, and coding exercises before publishing
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading pending courses queue...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Queue is clear!</h3>
            <p className="text-xs text-slate-400">
              There are currently zero courses submitted for administrative publishing review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition group"
              >
                <div className="h-44 bg-slate-800 relative overflow-hidden">
                  <img src={c.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    PENDING REVIEW
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{c.category}</span>
                    <h3 className="text-base font-bold text-white line-clamp-1 mt-0.5">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{c.shortDescription}</p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Instructor: <strong className="text-slate-300">{c.instructor?.name || 'Assigned Faculty'}</strong>
                    </p>
                  </div>

                  <a
                    href={`/courses/${c._id}/review`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <span>Inspect & Moderate</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
