'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Play,
  RotateCcw,
  X,
  Code2,
  FileCode,
} from 'lucide-react';

import { ChangeTargetCategory } from '@/lib/types';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';

interface ChangeFormProps {
  onReset: () => void;
  isSimulated: boolean;
}

const CATEGORY_DEFAULTS: Record<
  ChangeTargetCategory,
  { filePath: string; fileType: string; targetComponent: string; v1: string; v2: string; desc: string }
> = {
  Database: {
    filePath: 'sample-system/schema_v1.sql',
    fileType: 'sql',
    targetComponent: 'db-users',
    v1: 'CREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(255),\n  status INT DEFAULT 1\n);',
    v2: 'CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255),\n  status VARCHAR(50)\n);',
    desc: 'Migrate user primary key identifier from INT to UUID format.',
  },
  'TypeScript / React': {
    filePath: 'frontend/lib/auth.ts',
    fileType: 'typescript',
    targetComponent: 'auth-service',
    v1: 'export interface User {\n  id: number;\n  email: string;\n}\nexport async function login(email: string): Promise<User> {\n  return { id: 1, email };\n}',
    v2: 'export interface User {\n  id: string;\n  email: string;\n  role: string;\n}\nexport async function login(email: string, deviceId?: string): Promise<User> {\n  return { id: "uuid-1", email, role: "admin" };\n}',
    desc: 'Update authentication interface and login signature.',
  },
  Python: {
    filePath: 'backend/app/routes/auth.py',
    fileType: 'python',
    targetComponent: 'auth-service',
    v1: 'def login_user(email: str, password: str):\n    return {"token": "123", "user_id": 1}',
    v2: 'def login_user(email: str, password: str, device_fingerprint: str):\n    return {"token": "123", "user_id": "uuid-123"}',
    desc: 'Modify backend login router signature to require device fingerprint.',
  },
  OpenAPI: {
    filePath: 'sample-system/openapi.yaml',
    fileType: 'openapi',
    targetComponent: 'api-gateway',
    v1: 'openapi: 3.0.0\ninfo:\n  title: Core API\npaths:\n  /v1/users:\n    get:\n      summary: Get users',
    v2: 'openapi: 3.0.0\ninfo:\n  title: Core API\npaths:\n  /v2/users:\n    get:\n      summary: Get users v2',
    desc: 'Upgrade REST API endpoint schema from v1 to v2.',
  },
  'General Config': {
    filePath: 'sample-system/topology.json',
    fileType: 'config',
    targetComponent: 'api-gateway',
    v1: '{\n  "services": [{"id": "user-service"}]\n}',
    v2: '{\n  "services": [{"id": "user-service-v2"}]\n}',
    desc: 'Rename service identifier in system topology configuration.',
  },
  API: {
    filePath: 'sample-system/openapi.yaml',
    fileType: 'openapi',
    targetComponent: 'api-gateway',
    v1: 'openapi: 3.0.0\ninfo:\n  title: Core API',
    v2: 'openapi: 3.0.0\ninfo:\n  title: Core API v2',
    desc: 'Update API Gateway service contract.',
  },
};

export default function ChangeForm({ onReset, isSimulated }: ChangeFormProps) {
  const { runSimulation, isLoading, error, clearError } = useChangeShieldStore();

  const [category, setCategory] = useState<ChangeTargetCategory>('Database');
  const [repoUrl, setRepoUrl] = useState('https://github.com/Ratan697/buildsprint');
  const [targetComponent, setTargetComponent] = useState('db-users');
  const [filePath, setFilePath] = useState('sample-system/schema_v1.sql');
  const [v1Content, setV1Content] = useState(CATEGORY_DEFAULTS['Database'].v1);
  const [v2Content, setV2Content] = useState(CATEGORY_DEFAULTS['Database'].v2);
  const [description, setDescription] = useState(CATEGORY_DEFAULTS['Database'].desc);

  // GitHub Modal state
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [githubBranch, setGithubBranch] = useState<string>('main');
  const [githubToken, setGithubToken] = useState<string>('');

  const [fetchingGithub, setFetchingGithub] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);

  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleCategoryChange = (cat: ChangeTargetCategory) => {
    setCategory(cat);
    const def = CATEGORY_DEFAULTS[cat] || CATEGORY_DEFAULTS['Database'];
    setFilePath(def.filePath);
    setTargetComponent(def.targetComponent);
    setV1Content(def.v1);
    setV2Content(def.v2);
    setDescription(def.desc);
  };

  const handleCopyV1ToV2 = () => {
    setV2Content(v1Content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFetchFromGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchingGithub(true);
    setGithubError(null);
    setGithubSuccess(null);

    try {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
      }

      const owner = match[1];
      const repo = match[2].replace('.git', '');
      const path = filePath.trim().replace(/^\//, '');
      const branch = githubBranch.trim() || 'main';

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken.trim()}`;
      }

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers }
      );

      if (res.status === 404) {
        throw new Error(`File '${path}' not found in repo ${owner}/${repo} (branch: ${branch}).`);
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

      setV1Content(rawContent);
      setGithubSuccess(`Loaded ${path} from ${owner}/${repo}!`);
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

    const def = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS['Database'];

    await runSimulation({
      target_component: targetComponent,
      file_path: filePath.trim(),
      file_type: def.fileType,
      v1_content: v1Content,
      v2_content: v2Content,
      v1_sql: category === 'Database' ? v1Content : undefined,
      v2_sql: category === 'Database' ? v2Content : undefined,
      repo_url: repoUrl.trim() || undefined,
      branch: githubBranch.trim() || 'main',
      github_token: githubToken.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 shadow-xs"
    >
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Change Parameters</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Simulate modifications on ANY code, API, or schema file in your repository
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGithubModal(true)}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
        >
          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
          <span>📥 Load File from GitHub</span>
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

      {/* Category Tabs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700">File & Language Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              'Database',
              'TypeScript / React',
              'Python',
              'OpenAPI',
              'General Config',
            ] as ChangeTargetCategory[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`py-1.5 px-2.5 border rounded-md text-xs font-medium transition-colors cursor-pointer text-center ${
                category === cat
                  ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* GitHub Repository Target */}
        <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-lg flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span>GitHub Repository for Full-Codebase Cross-File Scan</span>
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/Ratan697/buildsprint"
            className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-md text-xs font-mono text-slate-900 focus:border-blue-400"
          />
        </div>

        {/* Target File Path and Architecture Node */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target File Path in Repo</span>
            </label>
            <input
              type="text"
              required
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. frontend/lib/auth.ts"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Origin Service / Component</label>
            <input
              type="text"
              required
              value={targetComponent}
              onChange={(e) => setTargetComponent(e.target.value)}
              placeholder="e.g. db-users or auth-service"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
            />
          </div>
        </div>

        {/* V1 Original Content */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Original File Content (V1)</label>
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
            rows={5}
            value={v1Content}
            onChange={(e) => setV1Content(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 font-mono focus:border-slate-400"
          />
        </div>

        {/* V2 Proposed Content */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Updated File Content (V2)</label>
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
            rows={5}
            value={v2Content}
            onChange={(e) => setV2Content(e.target.value)}
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
          className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Analyzing Universal Codebase Impact...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>▶ Run Full-Codebase Blast Radius Scan</span>
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

      {/* GitHub Load Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Load File from GitHub
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
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/Ratan697/buildsprint"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  File Path in Repository
                </label>
                <input
                  type="text"
                  required
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="frontend/lib/auth.ts"
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                      <span>Fetching File...</span>
                    </>
                  ) : (
                    <span>Fetch File Content</span>
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
