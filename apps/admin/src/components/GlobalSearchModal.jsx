'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, BookOpen, Code, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], courses: [], problems: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ users: [], courses: [], problems: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ users: [], courses: [], problems: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [usersRes, coursesRes, problemsRes] = await Promise.allSettled([
          adminApi.getUsers({ search: query, limit: 4 }),
          adminApi.getCourses({ search: query, limit: 4 }),
          adminApi.getCodingProblems({ search: query, limit: 4 }),
        ]);

        setResults({
          users: usersRes.status === 'fulfilled' ? usersRes.value.data.users || [] : [],
          courses: coursesRes.status === 'fulfilled' ? coursesRes.value.data.courses || [] : [],
          problems: problemsRes.status === 'fulfilled' ? problemsRes.value.data.problems || [] : [],
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path) => {
    onClose();
    router.push(path);
  };

  const hasResults =
    results.users.length > 0 || results.courses.length > 0 || results.problems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, instructors, courses, problems... (Press ESC to close)"
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.length > 0 && query.length < 2 && (
            <p className="text-center text-xs text-slate-500 py-6">Type at least 2 characters to search...</p>
          )}

          {!isLoading && query.length >= 2 && !hasResults && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No records found matching &quot;{query}&quot;</p>
            </div>
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Users</span>
              <div className="mt-1 space-y-1">
                {results.users.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => navigateTo(u.role === 'STUDENT' ? `/students/${u._id}` : `/instructors/${u._id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-800/70 transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      u.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-400' :
                      u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                      u.role === 'INSTRUCTOR' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Courses Section */}
          {results.courses.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Courses</span>
              <div className="mt-1 space-y-1">
                {results.courses.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => navigateTo(`/courses/${c._id}/review`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-800/70 transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.category} • {c.difficulty}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Problems Section */}
          {results.problems.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Coding Problems</span>
              <div className="mt-1 space-y-1">
                {results.problems.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => navigateTo('/coding-problems')}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-800/70 transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Code className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.difficulty} • {p.category}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigation Quick Search</span>
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
