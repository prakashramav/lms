'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyPlan, fetchGoals, fetchRevisionQueue } from '../../services/intelligenceService';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function CalendarPage() {
  const { accessToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [goals, setGoals] = useState([]);
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [p, g, r] = await Promise.all([
        fetchDailyPlan(accessToken).catch(() => null),
        fetchGoals(accessToken).catch(() => []),
        fetchRevisionQueue(accessToken).catch(() => null),
      ]);
      setPlan(p);
      setGoals(g || []);
      setRevision(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Learning Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Study Calendar
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Synchronized view of study plans, revision queues, and goal deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white px-3">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-700">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayDateStr;

              // Check if any goals due on this date
              const dayGoals = goals.filter((g) => g.deadline && g.deadline.split('T')[0] === dateStr);

              return (
                <div
                  key={`day-${day}`}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border transition flex flex-col justify-between ${
                    isToday
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                      : 'border-slate-100 dark:border-slate-700/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="hidden sm:inline text-[10px] font-bold text-brand-600 uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {isToday && plan?.tasks && (
                      <div className="text-[10px] truncate px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold">
                        {plan.tasks.length} tasks planned
                      </div>
                    )}
                    {dayGoals.map((g) => (
                      <div
                        key={g._id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                        title={g.title}
                      >
                        Goal: {g.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Agenda Detail */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <span>Today&apos;s Learning Agenda</span>
            </h3>
            <Link
              href="/daily-plan"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              <span>Manage Daily Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400">Loading schedule...</div>
          ) : plan?.tasks?.length === 0 ? (
            <p className="text-xs text-slate-400">No tasks on today&apos;s agenda.</p>
          ) : (
            <div className="space-y-3">
              {plan?.tasks?.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {t.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <span className="text-xs text-slate-400">{t.category} · {t.estimatedMinutes}m</span>
                    </div>
                  </div>

                  {t.href && (
                    <Link
                      href={t.href}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                    >
                      Start
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
