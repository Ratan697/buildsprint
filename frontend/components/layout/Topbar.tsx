'use client';

import React from 'react';
import { Bell, Settings, Menu } from 'lucide-react';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Toggle Navigation Menu"
          className="p-2 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
          Environment: Production Workspace
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-gray-500 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          type="button"
          aria-label="Settings"
          className="p-2 text-gray-500 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
