'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchStudents } from '../../services/instructorService';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  RotateCw,
} from 'lucide-react';

export default function StudentsCohortPage() {
  const { accessToken } = useAuth();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const q = {};
      if (searchQuery.trim()) q.search = searchQuery.trim();
      const res = await fetchStudents(accessToken, q);
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [accessToken, searchQuery]);

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Cohort</h1>
            <p className="text-sm text-slate-400">
              Track enrollment, completion progress, and performance across your courses
            </p>
          </div>
          <button
            onClick={loadStudents}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
            title="Refresh Cohort"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* COHORT TABLE */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No students enrolled yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Once you publish your courses, enrolled students and their learning progress will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Enrolled Course</th>
                  <th className="p-4">Enrolled Date</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-xs">
                          {st.studentName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{st.studentName || 'Student'}</div>
                          <div className="text-[11px] text-slate-500">{st.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-300">
                      {st.courseTitle || 'Course'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(st.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{st.progress || 0}%</span>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${st.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                        }`}
                      >
                        {st.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/students/${st.studentId || st.userId || st._id}?courseId=${st.courseId}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <span>Telemetry</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
