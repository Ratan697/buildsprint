'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Key,
  GitBranch,
  MessageSquare,
  Bell,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lock,
  Mail,
  Database,
  Activity,
  Globe,
  Check,
} from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';

export type SettingsTab = 'general' | 'backend' | 'integrations' | 'risk' | 'notifications';

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdDate: string;
  lastUsed: string;
  scope: 'Full Access' | 'Read Only';
}

const INITIAL_API_KEYS: ApiKeyRecord[] = [
  {
    id: 'key-1',
    name: 'GitHub Actions CI/CD Pipeline',
    prefix: 'cs_live_98f7...a812',
    createdDate: '2026-07-12',
    lastUsed: '10 mins ago',
    scope: 'Full Access',
  },
  {
    id: 'key-2',
    name: 'Datadog APM Telemetry Export',
    prefix: 'cs_live_44b1...e901',
    createdDate: '2026-08-01',
    lastUsed: '2 hours ago',
    scope: 'Read Only',
  },
  {
    id: 'key-3',
    name: 'Staging Local CLI Runner',
    prefix: 'cs_test_12a9...f443',
    createdDate: '2026-08-15',
    lastUsed: 'Yesterday',
    scope: 'Full Access',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Backend Health Status
  const [backendHealth, setBackendHealth] = useState<'Checking' | 'Online' | 'Offline'>('Checking');
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  const handleTestHealth = async () => {
    setIsTestingHealth(true);
    const isOnline = await checkBackendHealth();
    setIsTestingHealth(false);
    setBackendHealth(isOnline ? 'Online' : 'Offline');
    showToast(isOnline ? 'FastAPI Backend http://localhost:8000 is 100% Operational.' : 'FastAPI Backend reachable check failed.');
  };

  useEffect(() => {
    handleTestHealth();
  }, []);

  // Tab 1: General & Workspace State
  const [workspaceName, setWorkspaceName] = useState('ChangeShield Core');
  const [orgSlug, setOrgSlug] = useState('changeshield-enterprise');
  const [defaultEnv, setDefaultEnv] = useState('Production');
  const [retentionPolicy, setRetentionPolicy] = useState('90 Days');

  // Tab 2: Backend & API State
  const [apiBaseUrl, setApiBaseUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(INITIAL_API_KEYS);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'Full Access' | 'Read Only'>('Full Access');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  // Tab 3: GitHub & Integrations State
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXXXX');
  const [pagerdutyKey, setPagerdutyKey] = useState('pd_live_secret_998124');
  const [datadogApiKey, setDatadogApiKey] = useState('dd_api_key_441829');

  // Tab 4: Risk Preferences State
  const [autoBlockThreshold, setAutoBlockThreshold] = useState(8.0);
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [requireDualSignoff, setRequireDualSignoff] = useState(true);
  const [enforceDeprecationWindow, setEnforceDeprecationWindow] = useState(true);
  const [maxHopsLimit, setMaxHopsLimit] = useState(3);

  // Tab 5: Notifications & UI Preferences State
  const [notifyOnBlock, setNotifyOnBlock] = useState(true);
  const [notifyOnSimulationComplete, setNotifyOnSimulationComplete] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  // Global Save Handlers
  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Saved all ChangeShield workspace preferences & engine parameters.');
  };

  const handleResetDefaults = () => {
    setWorkspaceName('ChangeShield Core');
    setOrgSlug('changeshield-enterprise');
    setDefaultEnv('Production');
    setRetentionPolicy('90 Days');
    setAutoBlockThreshold(8.0);
    setBlockOnCritical(true);
    setRequireDualSignoff(true);
    setEnforceDeprecationWindow(true);
    setMaxHopsLimit(3);
    showToast('Reverted settings to default baseline configuration.');
  };

  const handleCopyKey = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKeyId(id);
    showToast('Copied token prefix to clipboard.');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevokeKey = (id: string, name: string) => {
    if (confirm(`Revoke API Key "${name}"?`)) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      showToast(`Revoked key "${name}".`);
    }
  };

  const handleGenerateKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const secret = `cs_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const prefix = `${secret.substring(0, 12)}...****`;

    const newKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      prefix: prefix,
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      scope: newKeyScope,
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setGeneratedSecret(secret);
    showToast('Generated new API secret token.');
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-slate-900" />
            Workspace Settings & Engine Preferences
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            FastAPI connectivity, repository webhooks, risk thresholds, and notification routing.
          </p>
        </div>

        {/* Global Save / Revert Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Revert Defaults
          </button>

          <button
            type="button"
            onClick={handleSaveAllSettings}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            Save All Changes
          </button>
        </div>
      </div>

      {/* Live Backend Connection Status Banner */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-md shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-mono">FastAPI Target: {apiBaseUrl}</span>
              {backendHealth === 'Online' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Operational
                </span>
              )}
              {backendHealth === 'Offline' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Unreachable (Local Cache Active)
                </span>
              )}
              {backendHealth === 'Checking' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" /> Checking...
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-0.5">
              Engine Version: ChangeShield v2.4.0 • Workspace ID: ws_changeshield_prod_882
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestHealth}
          disabled={isTestingHealth}
          className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isTestingHealth ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Multi-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General & Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backend')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'backend'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Backend & API</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>GitHub & Connected Integrations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risk')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'risk'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Risk Preferences & Gating</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications & Preferences</span>
        </button>
      </div>

      {/* Tab 1: General & Workspace */}
      {activeTab === 'general' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Workspace Profile & Retention</h2>
            <p className="text-xs text-gray-500 mt-0.5">Primary organization identifiers and data lifecycle settings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Workspace Display Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Organization Slug</label>
              <input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Default Target Deployment Environment</label>
              <select
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Audit Trail Data Retention Policy</label>
              <select
                value={retentionPolicy}
                onChange={(e) => setRetentionPolicy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="30 Days">30 Days</option>
                <option value="90 Days">90 Days (Recommended)</option>
                <option value="1 Year">1 Year (SOC 2 Standard)</option>
                <option value="Unlimited">Unlimited</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-gray-100">
            <span className="text-xs text-gray-500">Purge cached local simulation graphs to free storage space</span>
            <button
              type="button"
              onClick={() => showToast('Purged local simulation cache.')}
              className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded text-xs font-medium cursor-pointer"
            >
              Purge Simulation Cache
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Backend & API Configuration */}
      {activeTab === 'backend' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">FastAPI Backend Connection</h2>
              <p className="text-xs text-gray-500 mt-0.5">Configured target endpoint for schema simulation and graph analysis</p>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-gray-700">API Base URL (NEXT_PUBLIC_API_URL)</label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* API Keys Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Active API Keys</h2>
                <p className="text-xs text-gray-500 mt-0.5">Access tokens for CI/CD integrations and SDK calls</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGeneratedSecret(null);
                  setNewKeyName('');
                  setIsKeyModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New API Key</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                    <th className="pb-3 pl-1">Key Name</th>
                    <th className="pb-3 px-3">Token Prefix</th>
                    <th className="pb-3 px-3">Scope</th>
                    <th className="pb-3 px-3">Created Date</th>
                    <th className="pb-3 px-3">Last Used</th>
                    <th className="pb-3 pr-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {apiKeys.map((keyItem) => (
                    <tr key={keyItem.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-1 font-semibold text-slate-900 text-xs">{keyItem.name}</td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-700">{keyItem.prefix}</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded border bg-gray-100 text-gray-700 border-gray-200">
                          {keyItem.scope}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-gray-500">{keyItem.createdDate}</td>
                      <td className="py-3.5 px-3 text-xs text-gray-500">{keyItem.lastUsed}</td>
                      <td className="py-3.5 pr-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyKey(keyItem.id, keyItem.prefix)}
                            className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          >
                            {copiedKeyId === keyItem.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(keyItem.id, keyItem.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GitHub & Connected Integrations */}
      {activeTab === 'integrations' && (
        <div className="flex flex-col gap-6">
          {/* GitHub Connection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-lg shrink-0">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">GitHub App Integration</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active (200 OK)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Connected Account: <code className="font-mono text-slate-800">@Ratan697</code> • Monitored Repositories: 4 Repos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast('Opening GitHub OAuth configuration dialog...')}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              Configure Monitored Repos
            </button>
          </div>

          {/* Slack Integration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-slate-900">Slack PR Comments & Alerts</h3>
              </div>
              <span className="text-xs text-emerald-600 font-semibold">Enabled</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-gray-700">Slack Webhook Channel URL</label>
              <input
                type="text"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* PagerDuty & Datadog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-gray-200 rounded-lg flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-600" /> PagerDuty Incident Trigger
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Active</span>
              </div>
              <input
                type="text"
                value={pagerdutyKey}
                onChange={(e) => setPagerdutyKey(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-slate-900"
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Datadog APM Telemetry
                </span>
                <span className="text-[11px] text-gray-400">Disabled</span>
              </div>
              <input
                type="text"
                value={datadogApiKey}
                onChange={(e) => setDatadogApiKey(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Risk Preferences & Gating Policies */}
      {activeTab === 'risk' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Default CI/CD Gating & Risk Preferences</h2>
            <p className="text-xs text-gray-500 mt-0.5">Automated policy thresholds for PR merge blocks and architecture sign-offs</p>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-center font-semibold text-slate-900">
                <span>Default CI/CD Auto-Block Risk Threshold</span>
                <span className="font-mono text-rose-600 font-bold text-sm">{autoBlockThreshold} / 10.0</span>
              </div>
              <input
                type="range"
                min={5.0}
                max={10.0}
                step={0.5}
                value={autoBlockThreshold}
                onChange={(e) => setAutoBlockThreshold(Number(e.target.value))}
                className="accent-slate-900 cursor-pointer mt-1"
              />
              <p className="text-gray-500 text-[11px] mt-1">
                Any change simulation producing a risk score &gt;= {autoBlockThreshold} will automatically fail the CI/CD pull request check.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockOnCritical}
                  onChange={(e) => setBlockOnCritical(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">Block PR Merge on Critical Risk</span>
                  <span className="text-[11px] text-gray-500 mt-0.5">Strictly require dual-signoff before cutover</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireDualSignoff}
                  onChange={(e) => setRequireDualSignoff(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">Require Dual Sign-off for Tier-1 DBs</span>
                  <span className="text-[11px] text-gray-500 mt-0.5">Enforce lead architect approval on core databases</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceDeprecationWindow}
                  onChange={(e) => setEnforceDeprecationWindow(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">Enforce Column Deprecation Window</span>
                  <span className="text-[11px] text-gray-500 mt-0.5">Require 14-day expand/contract phase before dropping columns</span>
                </div>
              </label>

              <div className="flex flex-col gap-1 p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="font-semibold text-slate-900">Max Allowed Transitive Traversal Hops</span>
                <select
                  value={maxHopsLimit}
                  onChange={(e) => setMaxHopsLimit(Number(e.target.value))}
                  className="mt-1 px-2.5 py-1 bg-white border border-gray-300 rounded text-slate-900 font-mono focus:outline-none"
                >
                  <option value={2}>2 Hops Max</option>
                  <option value={3}>3 Hops Max (Standard)</option>
                  <option value={4}>4 Hops Max</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Notifications & Preferences */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Alert Routing & UI Preferences</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure developer notification channels and report digests</p>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnBlock}
                onChange={(e) => setNotifyOnBlock(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <span className="font-medium text-slate-800">Email alert immediately when a deployment is auto-blocked</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnSimulationComplete}
                onChange={(e) => setNotifyOnSimulationComplete(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <span className="font-medium text-slate-800">Send Slack message upon interactive simulation completion</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWeeklyDigest}
                onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <span className="font-medium text-slate-800">Send weekly executive compliance PDF audit digest</span>
            </label>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {generatedSecret ? 'API Token Secret Generated' : 'Generate New API Key'}
              </h3>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedSecret ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Copy this secret key now. For security purposes, it will not be shown again.</span>
                </div>

                <div className="p-3 bg-slate-950 text-emerald-300 font-mono text-xs rounded-md border border-slate-800 break-all select-all flex items-center justify-between gap-2">
                  <span>{generatedSecret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSecret);
                      showToast('Secret key copied to clipboard!');
                    }}
                    className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateKeySubmit} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Key Name</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. GitHub Actions CI Token"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Scope</label>
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as 'Full Access' | 'Read Only')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Full Access">Full Access (Read &amp; Write)</option>
                    <option value="Read Only">Read Only (Audit Stream)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
