'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlaySquare,
  Server,
  Network,
  ShieldAlert,
  FileText,
  Settings,
  Plus,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { getCurrentUser, User } from '@/lib/auth';

const ICON_MAP = {
  Overview: LayoutDashboard,
  Simulations: PlaySquare,
  Systems: Server,
  Dependencies: Network,
  'Risk Rules': ShieldAlert,
  Reports: FileText,
  Settings: Settings,
};

interface SidebarProps {
  onMobileClose?: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      setCurrentUser(getCurrentUser());
    };

    updateAuth();

    window.addEventListener('auth-change', updateAuth);
    window.addEventListener('storage', updateAuth);

    return () => {
      window.removeEventListener('auth-change', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-full shrink-0 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
          <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-2xs">
            C
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-base">ChangeShield</span>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex flex-col gap-1" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const IconComponent = ICON_MAP[item.name as keyof typeof ICON_MAP] || LayoutDashboard;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-slate-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-slate-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & CTA */}
      <div className="p-4 border-t border-gray-100 flex flex-col gap-4">
        <Link
          href="/simulations/new"
          onClick={onMobileClose}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Simulation</span>
        </Link>

        {/* Dynamic User Profile / Sign In Link */}
        {currentUser ? (
          <div className="flex items-center gap-3 pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-xs uppercase shadow-2xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-900 truncate">
                {currentUser.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onMobileClose}
            className="flex items-center gap-3 pt-2 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs group-hover:bg-gray-200">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-900 flex items-center gap-1">
                <span>Sign In</span>
                <LogIn className="w-3 h-3 text-slate-500" />
              </span>
              <span className="text-xs text-gray-500 truncate">Access your workspace</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
