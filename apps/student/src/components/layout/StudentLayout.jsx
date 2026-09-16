'use client';

import { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import Sidebar from './Sidebar';
import StudentHeader from './StudentHeader';
import MobileNav from './MobileNav';
import SearchModal from './SearchModal';

export default function StudentLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <StudentHeader
            onOpenSearch={() => setIsSearchOpen(true)}
            onToggleMobileNav={() => setIsMobileDrawerOpen(true)}
          />

          {/* Scrollable Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* Mobile Bottom Navigation & Drawer */}
          <MobileNav
            isDrawerOpen={isMobileDrawerOpen}
            setIsDrawerOpen={setIsMobileDrawerOpen}
          />
        </div>

        {/* Global Search Dialog */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
