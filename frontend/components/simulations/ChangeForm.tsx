'use client';

import React, { useState } from 'react';
import { ChangeTargetCategory } from '@/lib/types';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import {
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  GitBranch,
  Copy,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface ChangeFormProps {
  onReset: () => void;
  isSimulated: boolean;
}

export default function ChangeForm({ onReset, isSimulated }: ChangeFormProps) {
  const { runSimulation, isLoading, error, clearError } = useChangeShieldStore();

  const [category, setCategory] = useState<ChangeTargetCategory>('Database');
  const [targetComponent, setTargetComponent] = useState('db-users');
  const [v1Sql, setV1Sql] = useState('CREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(255),\n  status VARCHAR(50)\n);');
  const [v2Sql, setV2Sql] = useState('CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255),\n  phone VARCHAR(20)\n);');
  const [description, setDescription] = useState(
    'Migrate customer identifier from integer to UUID format across system schema.'
  );

  // GitHub Modal state
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>(
    'https://github.com/Ratan697/buildsprint'
  );
  const [githubFilePath, setGithubFilePath] = useState<string>(
    'sample-system/schema_v1.sql'
  );
  const [githubBranch, setGithubBranch] = useState<string>('main');
  const [githubToken, setGithubToken] = useState<string>('');

  const [fetchingGithub, setFetchingGithub] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);

  // Copy V1 to V2 state
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleCopyV1ToV2 = () => {
    setV2Sql(v1Sql);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFetchFromGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchingGithub(true);
    setGithubError(null);
    setGithubSuccess(null);

    try {
      const match = githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
      }

      const owner = match[1];
      const repo = match[2].replace('.git', '');
      const filePath = githubFilePath.trim().replace(/^\//, '');
      const branch = githubBranch.trim() || 'main';

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken.trim()}`;
      }

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        { headers }
      );

      if (res.status === 404) {
        throw new Error(`File '${filePath}' not found in repo ${owner}/${repo} (branch: ${branch}).`);
      } else if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch file from GitHub.');
      }

      const data = await res.json();
      let rawContent = '';

      if (data.encoding === 'base64' && data.content) {
        rawContent = atob(data.content.replace(/\n/g, ''));
      } else if (data.content) {
        rawContent = data.content;
      } else {
        throw new Error('Retrieved GitHub file content is empty.');
      }

      setV1Sql(rawContent);
      setGithubSuccess(`Loaded ${filePath} from ${owner}/${repo}!`);
      setTimeout(() => {
        setShowGithubModal(false);
        setGithubSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching file from GitHub.';
      setGithubError(msg);
    } finally {
      setFetchingGithub(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await runSimulation({
      target_component: targetComponent,
      v1_sql: v1Sql,
      v2_sql: v2Sql,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 shadow-xs"
    >
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Change Parameters</h2>
          <p className="text-xs text-gray-500 mt-0.5">Specify intended schema or service modification</p>
        </div>

        <button
          type="button"
          onClick={() => setShowGithubModal(true)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
        >
          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
          <span>📥 Load V1 from GitHub</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-red-600 hover:text-red-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Category Radio / Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Change Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Database', 'API'] as ChangeTargetCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-1.5 px-3 border rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Target Component */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Target Component (Start Node)</label>
          <input
            type="text"
            required
            value={targetComponent}
            onChange={(e) => setTargetComponent(e.target.value)}
            placeholder="e.g. db-users or user-service"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
          />
        </div>

        {/* v1 SQL Schema */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Original Schema Statement (v1_sql)</label>
            <button
              type="button"
              onClick={() => setShowGithubModal(true)}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <GitBranch className="w-3 h-3" />
              <span>Fetch from GitHub</span>
            </button>
          </div>
          <textarea
            rows={4}
            value={v1Sql}
            onChange={(e) => setV1Sql(e.target.value)}
            placeholder="CREATE TABLE users (id INT PRIMARY KEY);"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
          />
        </div>

        {/* v2 SQL Schema */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Updated Schema Statement (v2_sql)</label>
            <button
              type="button"
              onClick={handleCopyV1ToV2}
              className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer font-medium"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied from V1!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>📋 Copy V1 to V2</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={4}
            value={v2Sql}
            onChange={(e) => setV2Sql(e.target.value)}
            placeholder="CREATE TABLE users (id UUID PRIMARY KEY);"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Description / Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Change description..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:border-slate-400"
          />
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Analyzing blast radius...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Change</span>
            </>
          )}
        </button>

        {isSimulated && (
          <button
            type="button"
            onClick={onReset}
            title="Reset simulation graph"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors cursor-pointer border border-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* GitHub V1 Fetch Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Load V1 Schema from GitHub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  required
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/Ratan697/buildsprint"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target File Path
                </label>
                <input
                  type="text"
                  required
                  value={githubFilePath}
                  onChange={(e) => setGithubFilePath(e.target.value)}
                  placeholder="sample-system/schema_v1.sql"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 font-mono focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    GitHub Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {githubError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{githubError}</span>
                </div>
              )}

              {githubSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{githubSuccess}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGithubModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleFetchFromGithub}
                  disabled={fetchingGithub}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {fetchingGithub ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Schema...</span>
                    </>
                  ) : (
                    <span>Fetch Schema File</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
