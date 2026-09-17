'use client';

import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/layout/InstructorLayout';
import { useAuth } from '../../context/AuthContext';
import { fetchNotifications, markNotificationRead } from '../../services/instructorService';
import {
  Bell,
  CheckCircle2,
  Clock,
  RotateCw,
  BookOpen,
  Award,
  Users,
  Sparkles,
} from 'lucide-react';

export default function NotificationsPage() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchNotifications(accessToken);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [accessToken]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationRead(accessToken, 'all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Instructor Notifications
            </h1>
            <p className="text-sm text-slate-400">
              Student cohort milestones, course publishing updates, and system alerts
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 hover:text-white text-xs font-semibold transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* NOTIFICATIONS LIST */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up! When students enroll or submit assessments, alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                  notif.isRead
                    ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                    : 'bg-slate-900 border-teal-500/30 text-white shadow-sm'
                }`}
              >
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
