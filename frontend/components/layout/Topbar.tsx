'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings, Menu, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { getCurrentUser, logout, User as AuthUser } from '@/lib/auth';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleSignOut = () => {
    logout();
    setCurrentUser(null);
    setDropdownOpen(false);
    router.push('/login');
  };

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
          onClick={() => router.push('/settings')}
          aria-label="Settings"
          className="p-2 text-gray-500 hover:text-slate-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account / Profile Menu */}
        <div className="relative ml-2">
          {currentUser ? (
            <div>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-slate-400 text-[10px] leading-tight">
                    {currentUser.role?.toUpperCase()}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-slate-900">{currentUser.name}</p>
                    <p className="text-gray-400 text-[10px] truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
