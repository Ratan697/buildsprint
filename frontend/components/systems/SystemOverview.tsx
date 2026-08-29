'use client';

import React from 'react';
import { SystemStats } from '@/lib/types';
import { Server, Globe, Database, Share2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SystemOverviewProps {
  stats?: SystemStats;
  errorMessage?: string | null;
}

const defaultStats: SystemStats = {
  services: 7,
  apis: 14,
  databases: 3,
  externalIntegrations: 2,
  analysisStatus: 'Ready',
  lastAnalyzed: '15 mins ago',
};

export default function SystemOverview({ stats = defaultStats, errorMessage }: SystemOverviewProps) {
  const statItems = [
    { label: 'Services', count: stats.services, icon: Server, color: 'text-indigo-600' },
    { label: 'APIs', count: stats.apis, icon: Globe, color: 'text-sky-600' },
    { label: 'Databases', count: stats.databases, icon: Database, color: 'text-emerald-600' },
    {
      label: 'External Integrations',
      count: stats.externalIntegrations,
      icon: Share2,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">System Architecture Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Discovered components from current ingest</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.analysisStatus === 'Error' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Status: Offline
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Status: {stats.analysisStatus}
            </span>
          )}

          {stats.lastAnalyzed && (
            <span className="text-xs text-gray-500">Updated {stats.lastAnalyzed}</span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMessage} (Displaying local topology cache)</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200/80 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-md bg-white border border-gray-200 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {item.count}
                </span>
                <span className="text-xs font-medium text-gray-500">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
