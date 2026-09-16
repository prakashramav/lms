'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Terminal,
  Sparkles,
  Compass,
  MoreHorizontal,
  X,
  Layers,
  Cpu,
  Briefcase,
  Bell,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

export default function MobileNav({ isDrawerOpen, setIsDrawerOpen }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Learn', href: '/learning', icon: BookOpen },
    { name: 'Practice', href: '/practice', icon: Terminal },
    { name: 'AI', href: '/ai-tutor', icon: Sparkles },
    { name: 'Career', href: '/career', icon: Compass },
  ];

  const drawerItems = [
    { name: 'Quizzes & Assessments', href: '/assessments', icon: BookOpen },
    { name: 'Projects & Milestones', href: '/projects', icon: Layers },
    { name: 'AI Mock Interviews', href: '/interview', icon: Cpu },
    { name: 'Tech Jobs & Opportunities', href: '/jobs', icon: Briefcase },
    { name: 'Notifications Center', href: '/notifications', icon: Bell },
    { name: 'Profile & Portfolio', href: '/profile', icon: User },
    { name: 'Account Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around h-16 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* More Trigger */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition ${
            isDrawerOpen ? 'text-brand-600 dark:text-brand-400' : ''
          }`}
          aria-label="Open more options drawer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>

      {/* Slide-over Drawer for Mobile */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Additional Tools</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl min-h-[48px] text-sm font-semibold transition ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 min-h-[48px] rounded-xl text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
