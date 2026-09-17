'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { fetchNotifications } from '../../services/instructorService';
import AIAssistantModal from '../ai/AIAssistantModal';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Code2,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Assessments', href: '/assessments', icon: FileQuestion },
  { name: 'Coding Problems', href: '/practice', icon: Code2 },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function InstructorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (!isLoading && (!user || !accessToken)) {
      router.push('/login');
    }
  }, [isLoading, user, accessToken, router]);

  // Load notification count
  useEffect(() => {
    if (accessToken) {
      fetchNotifications(accessToken)
        .then((data) => {
          setUnreadNotifications(data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [accessToken]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying instructor session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">Apex Academy</span>
              <span className="block text-[10px] text-teal-400 font-semibold tracking-wider uppercase">Instructor Studio</span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.href === '/notifications' && unreadNotifications > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-white">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Authoring & Quick Course Action */}
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-800/80 border border-teal-900/40 text-center space-y-2">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Authoring Assistant</span>
          </button>
          <Link
            href="/courses/new"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Course
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'I'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <header className="md:hidden h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">Instructor Studio</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500" />
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-slate-900 h-full p-4 flex flex-col justify-between z-10 shadow-2xl border-r border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Instructor Studio</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <Link
                href="/courses/new"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 px-2 py-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {children}
        </div>
      </main>

      {/* AI ASSISTANT MODAL */}
      <AIAssistantModal
        accessToken={accessToken}
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </div>
  );
}
