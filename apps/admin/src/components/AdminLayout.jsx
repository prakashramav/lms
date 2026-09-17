'use client';

import { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import GlobalSearchModal from './GlobalSearchModal';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  ClipboardCheck,
  Code2,
  Tags,
  AlertTriangle,
  BarChart3,
  Cpu,
  Activity,
  FileClock,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isSuperAdmin, hasPermission, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Protect admin routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Verifying Administrative Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'All Users', href: '/users', icon: Users, perm: 'users.read' },
    { label: 'Students', href: '/students', icon: GraduationCap, perm: 'users.read' },
    { label: 'Instructors', href: '/instructors', icon: Briefcase, perm: 'users.read' },
    { label: 'Courses', href: '/courses', icon: BookOpen, perm: 'courses.read' },
    { label: 'Assessments', href: '/assessments', icon: ClipboardCheck, perm: 'assessments.manage' },
    { label: 'Coding Problems', href: '/coding-problems', icon: Code2, perm: 'problems.manage' },
    { label: 'Categories', href: '/categories', icon: Tags, perm: 'categories.manage' },
    { label: 'Moderation Queue', href: '/reports', icon: AlertTriangle, perm: 'reports.manage' },
    { label: 'Analytics', href: '/analytics', icon: BarChart3, perm: 'analytics.read' },
    { label: 'AI Monitoring', href: '/ai-monitoring', icon: Cpu, perm: 'analytics.read' },
    { label: 'System Health', href: '/system-health', icon: Activity },
    { label: 'Audit Logs', href: '/audit-logs', icon: FileClock, perm: 'audit.read' },
    { label: 'Announcements', href: '/notifications', icon: Bell },
    { label: 'Platform Settings', href: '/settings', icon: Settings, perm: 'settings.manage' },
    ...(isSuperAdmin
      ? [{ label: 'Admin Management', href: '/admins', icon: ShieldCheck, superOnly: true }]
      : []),
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.superOnly) return isSuperAdmin;
    if (item.perm) return hasPermission(item.perm);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Global Command Palette Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">ApexEd</span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold block -mt-1">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.superOnly && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300">
                    SUPER
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <span className="text-[10px] text-indigo-400 font-medium block truncate">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white">ApexEd Admin</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="w-72 bg-slate-900 h-full border-r border-slate-800 flex flex-col p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Bar */}
        <div className="hidden md:flex h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 items-center justify-between sticky top-0 z-10">
          {/* Global Search Shortcut Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center space-x-3 px-3.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition shadow-inner w-72"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="flex-1 text-left">Quick Search...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Operational Status & Role Badges */}
          <div className="flex items-center space-x-4">
            <a
              href="/system-health"
              className="flex items-center space-x-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cluster Operational</span>
            </a>

            <div className="flex items-center space-x-2 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content Viewport */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
