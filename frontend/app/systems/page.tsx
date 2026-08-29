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
} from 'lucide-react';

import { FileUpload } from '@/components/systems/FileUpload';
import { ingestFile, ingestRaw, fetchSystems, SystemRecord, SystemStats } from '@/lib/api';

export default function SystemsPage() {
  const [activeTab, setActiveTab] = useState<'file' | 'github' | 'raw'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<string>('sql');
  const [rawContent, setRawContent] = useState<string>('');
  const [systemName, setSystemName] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com/org/payment-core');

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

  // Load existing systems list on mount
  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    const res = await fetchSystems();
    if (res.data) {
      setSystemsList(res.data);
      // If systems exist, set stats from the most recent system
      if (res.data.length > 0) {
        const latestStats = res.data[res.data.length - 1].stats;
        setSystemStats(latestStats);
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
        if (!githubUrl.trim()) {
          setErrorMessage('Please enter a valid GitHub repository URL.');
          setAnalyzing(false);
          return;
        }
        // Demo topology extraction for repository URL
        const sampleTopology = JSON.stringify({
          services: [
            { id: 'api-gateway', criticality: 3.0, type: 'gateway' },
            { id: 'user-service', criticality: 4.0, type: 'backend' },
            { id: 'auth-service', criticality: 5.0, type: 'backend' },
            { id: 'db-users', criticality: 5.0, type: 'database' },
          ],
          edges: [
            { source: 'api-gateway', target: 'auth-service', relation: 'calls' },
            { source: 'auth-service', target: 'user-service', relation: 'depends_on' },
            { source: 'user-service', target: 'db-users', relation: 'reads_writes' },
          ],
        });
        const repoName = githubUrl.split('/').pop() || 'github-repo';
        response = await ingestRaw(repoName, 'json', sampleTopology);
      }

      if (response && response.data) {
        setSystemStats(response.data.stats);
        setSuccessMessage(`System "${response.data.name}" ingested and analyzed successfully!`);
        await loadSystems();
      } else {
        setErrorMessage(response?.error || 'Failed to ingest system topology.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          System Topology Ingestion
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Import databases, OpenAPI endpoints, or topology configurations to generate dependency graph models.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Services</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.services}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">APIs / Endpoints</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.apis}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Databases</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.databases}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Dependency Edges</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.edges}</p>
          </div>
        </div>
      </div>

      {/* Ingestion Config Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Ingest New System</h2>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('file');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-gray-600 hover:text-slate-900'
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
                  : 'text-gray-600 hover:text-slate-900'
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
                  : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </button>
          </div>
        </div>

        {/* Source Format Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Source Format Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="sql">SQL Schema (DDL)</option>
              <option value="openapi">OpenAPI / Swagger Spec</option>
              <option value="json">JSON Topology Format</option>
            </select>
          </div>

          {(activeTab === 'raw' || activeTab === 'github') && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                System Name
              </label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g. User Authentication System"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}
        </div>

        {/* Tab Body */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <FileUpload
              selectedFile={selectedFile}
              onFileSelected={(file) => setSelectedFile(file)}
            />
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Paste Schema / Spec String
            </label>
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={8}
              placeholder={
                sourceType === 'sql'
                  ? 'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));\nCREATE TABLE orders (id INT PRIMARY KEY, user_id INT REFERENCES users(id));'
                  : sourceType === 'openapi'
                  ? 'openapi: 3.0.0\ninfo:\n  title: Payment Service\npaths:\n  /charge:\n    post:\n      summary: Process charge'
                  : '{"services": [{"id": "user-service"}], "edges": []}'
              }
              className="w-full font-mono text-xs bg-white border border-gray-300 rounded-md p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        )}

        {activeTab === 'github' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/organization/repo"
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center space-x-2 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleAnalyzeSystem}
            disabled={analyzing}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-xs disabled:opacity-50 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing & Ingesting Architecture...</span>
              </>
            ) : (
              <span>Analyze & Ingest System</span>
            )}
          </button>
        </div>
      </div>

      {/* Systems Registry Table */}
      {systemsList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold text-sm text-slate-900">
            Ingested Systems Registry ({systemsList.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
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
              <tbody className="divide-y divide-gray-100">
                {systemsList.map((sys) => (
                  <tr key={sys.system_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{sys.name}</td>
                    <td className="px-4 py-3 uppercase text-gray-500 font-mono">{sys.source_type}</td>
                    <td className="px-4 py-3">{sys.stats.services}</td>
                    <td className="px-4 py-3">{sys.stats.apis}</td>
                    <td className="px-4 py-3">{sys.stats.databases}</td>
                    <td className="px-4 py-3">{sys.stats.edges}</td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">
                      {(() => {
                        if (!sys.created_at) return 'N/A';
                        const normalized = sys.created_at.endsWith('Z') || sys.created_at.includes('+') ? sys.created_at : `${sys.created_at}Z`;
                        const d = new Date(normalized);
                        return isNaN(d.getTime()) ? sys.created_at : d.toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        });
                      })()}
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
