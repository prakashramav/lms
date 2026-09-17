'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  Code2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function CodingProblemsManagementPage() {
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProblems = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCodingProblems({
        page,
        limit: 15,
        search,
        difficulty: difficultyFilter,
        category: categoryFilter,
      });
      setProblems(res.data?.problems || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load coding problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(1);
  }, [difficultyFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProblems(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Coding Practice Problem Bank</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise algorithm challenges, language runners, and sandbox acceptance telemetry ({pagination.total} total)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="JavaScript">JavaScript</option>
              <option value="HTML/CSS">HTML/CSS</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="Express.js">Express.js</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Challenge</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Submissions</th>
                  <th className="p-4">Accepted</th>
                  <th className="p-4 text-right">Protection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                      Loading problem bank...
                    </td>
                  </tr>
                ) : problems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No problems match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  problems.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <p className="font-semibold text-slate-200">{p.title}</p>
                        <p className="text-[11px] text-slate-500">{p.slug}</p>
                      </td>
                      <td className="p-4 text-slate-300">
                        {p.category}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-400' :
                          p.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-mono">
                        {p.totalSubmissions || 0}
                      </td>
                      <td className="p-4 text-emerald-400 font-mono font-semibold">
                        {p.acceptedSubmissions || 0}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Test Cases Protected</span>
                        </span>
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
                  onClick={() => fetchProblems(pagination.page - 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProblems(pagination.page + 1)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
