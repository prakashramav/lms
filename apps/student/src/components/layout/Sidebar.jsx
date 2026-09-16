'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Terminal,
  Layers,
  Sparkles,
  Cpu,
  Compass,
  Briefcase,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('apex_sidebar_collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch (e) {}
  }, [setIsCollapsed]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem('apex_sidebar_collapsed', String(nextState));
    } catch (e) {}
  };

  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Learn', href: '/learning', icon: BookOpen },
    { name: 'Assessments', href: '/assessments', icon: Award },
    { name: 'Practice', href: '/practice', icon: Terminal },
    { name: 'Projects', href: '/projects', icon: Layers },
    { name: 'AI Tutor', href: '/ai-tutor', icon: Sparkles },
    { name: 'Interview', href: '/interview', icon: Cpu },
    { name: 'Career', href: '/career', icon: Compass },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
  ];

  const secondaryNav = [
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.name}
        href={item.href}
        title={isCollapsed ? item.name : undefined}
        className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 transition-colors ${
            isActive
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
          }`}
        />
        {!isCollapsed && <span className="truncate">{item.name}</span>}

        {/* Hover tooltip when collapsed */}
        {isCollapsed && (
          <span className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 truncate"
            >
              Apex<span className="text-brand-600">Learn</span>
            </Link>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Platform
            </p>
          )}
          {mainNav.map(renderNavItem)}
        </nav>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Personal
            </p>
          )}
          {secondaryNav.map(renderNavItem)}
        </nav>
      </div>

      {/* Bottom User Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
        <button
          onClick={() => alert('Student Help & Knowledge Center will be activated in upcoming phases.')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isCollapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-slate-400" />
          {!isCollapsed && <span>Help Center</span>}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
