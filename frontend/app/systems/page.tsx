'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  GitBranch,
  Database,
  Layers,
  Network,
  Cpu,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';

import { FileUpload } from '@/components/systems/FileUpload';
import {
  ingestFile,
  ingestRaw,
  ingestPostgres,
  ingestGithub,
  fetchSystems,
  SystemRecord,
  SystemStats,
} from '@/lib/api';

export default function SystemsPage() {
  const [activeTab, setActiveTab] = useState<'file' | 'raw' | 'github' | 'postgres'>('file');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<string>('sql');

  // Raw Content State
  const [rawContent, setRawContent] = useState<string>('');
  const [systemName, setSystemName] = useState<string>('');

  // GitHub State
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('https://github.com/Ratan697/buildsprint');
  const [githubFilePath, setGithubFilePath] = useState<string>('sample-system/schema_v1.sql');
  const [githubBranch, setGithubBranch] = useState<string>('main');
  const [githubToken, setGithubToken] = useState<string>('');

  // Live PostgreSQL State
  const [postgresConnUrl, setPostgresConnUrl] = useState<string>(
    'postgresql://postgres:password@localhost:5432/changeshield_db'
  );

  // Status & Metrics
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [systemStats, setSystemStats] = useState<SystemStats>({
    services: 0,
    apis: 0,
    databases: 0,
    edges: 0,
  });

  const [systemsList, setSystemsList] = useState<SystemRecord[]>([]);

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    const res = await fetchSystems();
    if (res.data) {
      setSystemsList(res.data);
      if (res.data.length > 0) {
        setSystemStats(res.data[0].stats);
      }
    }
  };

  const handleAnalyzeSystem = async () => {
    setAnalyzing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let response;

      if (activeTab === 'file') {
        if (!selectedFile) {
          setErrorMessage('Please select a file to upload (.sql, .json, .yaml, or .yml).');
          setAnalyzing(false);
          return;
        }
        response = await ingestFile(selectedFile, sourceType);
      } else if (activeTab === 'raw') {
        if (!rawContent.trim()) {
          setErrorMessage('Please enter raw schema or specification content.');
          setAnalyzing(false);
          return;
        }
        const name = systemName.trim() || `raw-${sourceType}-system`;
        response = await ingestRaw(name, sourceType, rawContent);
      } else if (activeTab === 'github') {
        if (!githubRepoUrl.trim()) {
          setErrorMessage('Please enter a valid GitHub repository URL.');
          setAnalyzing(false);
          return;
        }
        const name = systemName.trim() || githubRepoUrl.split('/').pop() || 'github-system';
        response = await ingestGithub({
          system_name: name,
          repo_url: githubRepoUrl.trim(),
          file_path: githubFilePath.trim() || undefined,
          branch: githubBranch.trim() || 'main',
          github_token: githubToken.trim() || undefined,
        });
      } else if (activeTab === 'postgres') {
        if (!postgresConnUrl.trim()) {
          setErrorMessage('Please enter a PostgreSQL connection URL.');
          setAnalyzing(false);
          return;
        }
        const name = systemName.trim() || 'Live PostgreSQL Database';
        response = await ingestPostgres({
          system_name: name,
          connection_url: postgresConnUrl.trim(),
        });
      }

      if (response && response.data) {
        setSystemStats(response.data.stats);
        setSuccessMessage(`System "${response.data.name}" ingested and analyzed successfully!`);
        await loadSystems();
      } else {
        setErrorMessage(response?.error || 'Failed to ingest system topology.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTimestamp = (isoStr: string | null | undefined) => {
    if (!isoStr) return 'N/A';
    const normalized = isoStr.endsWith('Z') || isoStr.includes('+') ? isoStr : `${isoStr}Z`;
    const d = new Date(normalized);
    return isNaN(d.getTime())
      ? isoStr
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          System Topology Ingestion
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Import live PostgreSQL databases, GitHub specs, or topology files to generate dependency models.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Services</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.services}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">APIs / Endpoints</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.apis}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Databases</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.databases}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Dependency Edges</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.edges}</p>
          </div>
        </div>
      </div>

      {/* Ingestion Config Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">
            Ingest System
          </h2>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('file');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>File Upload</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('raw');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw Content</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('github');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub API</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('postgres');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'postgres'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-amber-500" />
              <span>Live PostgreSQL</span>
            </button>
          </div>
        </div>

        {/* System Identifier Name (for tabs that use it) */}
        {activeTab !== 'file' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              System Identifier Name
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder={
                activeTab === 'postgres'
                  ? 'e.g. Production PostgreSQL DB'
                  : activeTab === 'github'
                  ? 'e.g. E-Commerce Core Repo'
                  : 'e.g. Custom Raw Schema'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
        )}

        {/* Tab 1: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Source Format Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="sql">SQL Schema (DDL)</option>
                <option value="openapi">OpenAPI / Swagger Spec</option>
                <option value="json">JSON Topology Format</option>
              </select>
            </div>
            <FileUpload
              selectedFile={selectedFile}
              onFileSelected={(file) => setSelectedFile(file)}
            />
          </div>
        )}

        {/* Tab 2: Raw Content */}
        {activeTab === 'raw' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Source Format Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="sql">SQL Schema (DDL)</option>
                <option value="openapi">OpenAPI / Swagger Spec</option>
                <option value="json">JSON Topology Format</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste Schema / Spec String
              </label>
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={8}
                placeholder="CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));"
                className="w-full font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        )}

        {/* Tab 3: GitHub REST API */}
        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/Ratan697/buildsprint"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target File Path (e.g. sample-system/schema_v1.sql)
                </label>
                <input
                  type="text"
                  value={githubFilePath}
                  onChange={(e) => setGithubFilePath(e.target.value)}
                  placeholder="sample-system/schema_v1.sql"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Git Branch
                </label>
                <input
                  type="text"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GitHub Token (Optional for Private Repos)
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_••••••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Live PostgreSQL Introspection */}
        {activeTab === 'postgres' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PostgreSQL Connection URI
              </label>
              <input
                type="text"
                value={postgresConnUrl}
                onChange={(e) => setPostgresConnUrl(e.target.value)}
                placeholder="postgresql://user:password@host:5432/dbname?sslmode=require"
                className="w-full font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Connects live to inspect table definitions, columns, primary keys, and foreign keys directly from `information_schema`.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleAnalyzeSystem}
            disabled={analyzing}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-xs disabled:opacity-50 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {activeTab === 'postgres'
                    ? 'Introspecting Database...'
                    : activeTab === 'github'
                    ? 'Fetching from GitHub...'
                    : 'Parsing & Analyzing System...'}
                </span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>
                  {activeTab === 'postgres'
                    ? 'Test & Introspect Database'
                    : activeTab === 'github'
                    ? 'Fetch & Ingest from GitHub'
                    : 'Analyze & Ingest System'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Systems Registry Table */}
      {systemsList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-900">
            Ingested Systems Registry ({systemsList.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">System Name</th>
                  <th className="px-4 py-3">Source Type</th>
                  <th className="px-4 py-3">Services</th>
                  <th className="px-4 py-3">APIs</th>
                  <th className="px-4 py-3">Databases</th>
                  <th className="px-4 py-3">Edges</th>
                  <th className="px-4 py-3 text-right">Ingested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {systemsList.map((sys) => (
                  <tr key={sys.system_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {sys.name}
                    </td>
                    <td className="px-4 py-3 uppercase text-slate-500 font-semibold">
                      {sys.source_type}
                    </td>
                    <td className="px-4 py-3">{sys.stats.services}</td>
                    <td className="px-4 py-3">{sys.stats.apis}</td>
                    <td className="px-4 py-3">{sys.stats.databases}</td>
                    <td className="px-4 py-3 font-bold">{sys.stats.edges}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">
                      {formatTimestamp(sys.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
