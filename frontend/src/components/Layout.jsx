import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, Menu } from 'lucide-react';

export default function Layout({ user, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full shrink-0 shadow-xl z-10">
        <Sidebar user={user} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 shadow-2xl">
            <Sidebar user={user} collapsed={false} setCollapsed={() => {}} />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-400 hidden md:block">
              Wildlife Population Intelligence System
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification icon (placeholder) */}
            <button className="relative h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User avatar */}
            <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
