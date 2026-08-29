'use client';

import React, { useState, useEffect } from 'react';
import SourceSelector from '@/components/systems/SourceSelector';
import FileUpload from '@/components/systems/FileUpload';
import SystemOverview from '@/components/systems/SystemOverview';
import { SourceType, SystemStats } from '@/lib/types';
import { checkBackendHealth } from '@/lib/api';
import { GitBranch, Play, CheckCircle, Loader2 } from 'lucide-react';

export default function SystemsPage() {
  const [selectedSource, setSelectedSource] = useState<SourceType>('github');
  const [repoUrl, setRepoUrl] = useState('https://github.com/org/payment-core');
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    services: 7,
    apis: 14,
    databases: 3,
    externalIntegrations: 2,
    analysisStatus: 'Ready',
    lastAnalyzed: '15 mins ago',
  });

  useEffect(() => {
    async function verifyHealth() {
      const isOnline = await checkBackendHealth();
      setBackendAvailable(isOnline);
      if (!isOnline) {
        setSystemStats((prev) => ({
          ...prev,
          analysisStatus: 'Ready',
        }));
      }
    }
    verifyHealth();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const isOnline = await checkBackendHealth();
    setBackendAvailable(isOnline);

    setTimeout(() => {
      setAnalyzing(false);
      setCompleted(true);
      setSystemStats({
        services: 7,
        apis: 14,
        databases: 3,
        externalIntegrations: 2,
        analysisStatus: 'Ready',
        lastAnalyzed: 'Just now',
      });
    }, 600);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Systems</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your system to map dependencies.</p>
      </div>

      {/* Step 1: Select Ingestion Source */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-900">Select System Source</label>
        <SourceSelector
          selectedSource={selectedSource}
          disabled={analyzing}
          onSelectSource={(src) => {
            setSelectedSource(src);
            setCompleted(false);
          }}
        />
      </div>

      {/* Step 2: Source Details Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Source Configuration</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Provide source credentials or files for architecture ingestion
          </p>
        </div>

        {selectedSource === 'github' ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700">GitHub Repository URL</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <GitBranch className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={analyzing}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <FileUpload
            disabled={analyzing}
            acceptedExtensions={
              selectedSource === 'sql'
                ? ['.sql']
                : selectedSource === 'openapi'
                ? ['.json', '.yaml', '.yml']
                : ['.json']
            }
          />
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            {completed ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Re-Analyze System</span>
              </>
            ) : analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Architecture...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Analyze System</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 3: Architecture Component Overview */}
      <SystemOverview
        stats={systemStats}
        errorMessage={
          backendAvailable === false ? 'FastAPI service reachable state check failed.' : null
        }
      />
    </div>
  );
}
