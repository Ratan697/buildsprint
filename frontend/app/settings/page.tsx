'use client';

import React, { useState } from 'react';
import {
  Settings,
  Key,
  Webhook,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  Building2,
  Shield,
  Bell,
  MessageSquare,
  GitBranch,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Mail,
  Lock,
} from 'lucide-react';

export type SettingsTab = 'workspace' | 'integrations' | 'apikeys' | 'team';

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdDate: string;
  lastUsed: string;
  scope: 'Full Access' | 'Read Only';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Engineer' | 'Viewer';
  twoFactorEnabled: boolean;
}

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key-1',
    name: 'CI/CD Pipeline Key (GitHub Actions)',
    prefix: 'cs_live_98f7...a812',
    createdDate: '2026-07-12',
    lastUsed: '10 mins ago',
    scope: 'Full Access',
  },
  {
    id: 'key-2',
    name: 'Production Monitoring Integration',
    prefix: 'cs_live_44b1...e901',
    createdDate: '2026-08-01',
    lastUsed: '2 hours ago',
    scope: 'Read Only',
  },
  {
    id: 'key-3',
    name: 'Staging Auto-Simulator Service',
    prefix: 'cs_test_12a9...f443',
    createdDate: '2026-08-15',
    lastUsed: 'Yesterday',
    scope: 'Full Access',
  },
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'alex.chen@changeshield.io',
    role: 'Owner',
    twoFactorEnabled: true,
  },
  {
    id: 'user-2',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@changeshield.io',
    role: 'Admin',
    twoFactorEnabled: true,
  },
  {
    id: 'user-3',
    name: 'David Kumar',
    email: 'david.kumar@changeshield.io',
    role: 'Engineer',
    twoFactorEnabled: true,
  },
  {
    id: 'user-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@changeshield.io',
    role: 'Viewer',
    twoFactorEnabled: false,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tab 1: Workspace & Environment Form State
  const [workspaceName, setWorkspaceName] = useState('Production Engineering Workspace');
  const [orgSlug, setOrgSlug] = useState('changeshield-enterprise');
  const [retentionPeriod, setRetentionPeriod] = useState('90 days');
  const [prodGuardrailMode, setProdGuardrailMode] = useState('Strict Guardrails');
  const [stagingGuardrailMode, setStagingGuardrailMode] = useState('Moderate Audit');
  const [devGuardrailMode, setDevGuardrailMode] = useState('Permissive');

  // Tab 2: Integrations Form State
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXXXX');
  const [notifyOnCritical, setNotifyOnCritical] = useState(true);
  const [notifyOnBlastRadius, setNotifyOnBlastRadius] = useState(true);
  const [notifyOnDailySummary, setNotifyOnDailySummary] = useState(false);
  const [pagerdutyEnabled, setPagerdutyEnabled] = useState(true);
  const [datadogEnabled, setDatadogEnabled] = useState(false);

  // Tab 3: API Keys State & Modal
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'Full Access' | 'Read Only'>('Full Access');
  const [generatedSecretToken, setGeneratedSecretToken] = useState<string | null>(null);

  // Tab 4: Team State & Modal
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Engineer' | 'Viewer'>('Engineer');

  // Handlers
  const handleSaveWorkspaceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Workspace & Environment settings updated successfully.');
  };

  const handleTestSlackWebhook = () => {
    showToast('Sent test notification to Slack channel #schema-risk-alerts.');
  };

  const handleCopyKey = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKeyId(id);
    showToast('API Key copied to clipboard.');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevokeKey = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke API Key "${name}"?`)) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      showToast(`Revoked API Key "${name}".`);
    }
  };

  const handleGenerateKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const secret = `cs_live_${randomSuffix}${Math.random().toString(36).substring(2, 10)}`;
    const prefix = `${secret.substring(0, 12)}...****`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      prefix: prefix,
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      scope: newKeyScope,
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setGeneratedSecretToken(secret);
    showToast('Generated new API Key.');
  };

  const handleRemoveTeamMember = (id: string, name: string) => {
    if (confirm(`Remove team member "${name}" from workspace?`)) {
      setTeam((prev) => prev.filter((m) => m.id !== id));
      showToast(`Removed team member "${name}".`);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      twoFactorEnabled: false,
    };

    setTeam((prev) => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    showToast(`Sent workspace invite to ${inviteEmail}.`);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-900" />
          Platform Settings & Workspace
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure workspace profiles, environment guardrails, webhooks, API tokens, and team RBAC.
        </p>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-slate-900 hover:border-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace & Environments</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-slate-900 hover:border-gray-300'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Integrations & Webhooks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('apikeys')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'apikeys'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-slate-900 hover:border-gray-300'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys & Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'team'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-gray-500 hover:text-slate-900 hover:border-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & RBAC</span>
        </button>
      </div>

      {/* Tab 1: Workspace & Environments */}
      {activeTab === 'workspace' && (
        <form onSubmit={handleSaveWorkspaceSettings} className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Workspace Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Primary workspace identifier and compliance retention</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Workspace Display Name</label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Organization Slug</label>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs max-w-sm">
              <label className="font-semibold text-gray-700">Audit Log Retention Policy</label>
              <select
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="30 days">30 Days</option>
                <option value="90 days">90 Days (Recommended)</option>
                <option value="1 year">1 Year (SOC 2 Standard)</option>
                <option value="Indefinite">Indefinite (Unlimited)</option>
              </select>
            </div>
          </div>

          {/* Environment Guardrail Configurations */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Environment Guardrail Modes</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enforcement sensitivity per deployment target</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Production */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Production</span>
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold rounded">
                    Strict
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Automatically blocks migrations that trigger critical DDL policy violations or exceed blast radius limits.
                </p>
                <select
                  value={prodGuardrailMode}
                  onChange={(e) => setProdGuardrailMode(e.target.value)}
                  className="mt-auto px-2.5 py-1.5 bg-white border border-gray-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Strict Guardrails">Strict Guardrails (Auto-Block)</option>
                  <option value="Moderate Audit">Moderate Audit (Require Approval)</option>
                </select>
              </div>

              {/* Staging */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Staging</span>
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded">
                    Audit
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Triggers architect reviews when breaking schema modifications or unknown cross-service dependencies occur.
                </p>
                <select
                  value={stagingGuardrailMode}
                  onChange={(e) => setStagingGuardrailMode(e.target.value)}
                  className="mt-auto px-2.5 py-1.5 bg-white border border-gray-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Moderate Audit">Moderate Audit (Require Approval)</option>
                  <option value="Permissive">Permissive (Dry-Run Warnings)</option>
                </select>
              </div>

              {/* Development */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Development</span>
                  <span className="px-2 py-0.5 bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-semibold rounded">
                    Permissive
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Non-blocking dry-run analysis for local schema testing and fast developer iteration.
                </p>
                <select
                  value={devGuardrailMode}
                  onChange={(e) => setDevGuardrailMode(e.target.value)}
                  className="mt-auto px-2.5 py-1.5 bg-white border border-gray-300 rounded text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Permissive">Permissive (Dry-Run Warnings)</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                Save Workspace Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Integrations & Webhooks */}
      {activeTab === 'integrations' && (
        <div className="flex flex-col gap-6">
          {/* GitHub Integration Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-lg">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">GitHub App Integration</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  14 repositories synced. Automatically analyzes PR schema migrations and posts blast radius checks.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast('Opening GitHub Repository Access Configuration...')}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              Configure Repositories
            </button>
          </div>

          {/* Slack Webhook Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 shadow-2xs">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-slate-900">Slack Risk Notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Stream real-time schema violation alerts and risk analysis reports to team channels.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Incoming Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleTestSlackWebhook}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Test Webhook
                  </button>
                </div>
              </div>

              {/* Event Triggers */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="font-semibold text-gray-700">Notification Event Triggers</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnCritical}
                      onChange={(e) => setNotifyOnCritical(e.target.checked)}
                      className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 font-medium">On Critical Blocked Changes</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnBlastRadius}
                      onChange={(e) => setNotifyOnBlastRadius(e.target.checked)}
                      className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 font-medium">On High Blast Radius Traversal</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnDailySummary}
                      onChange={(e) => setNotifyOnDailySummary(e.target.checked)}
                      className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 font-medium">On Daily Compliance Summary</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Alerting Switches Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-gray-100 pb-3">
              Ops Incident Alerting
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">PagerDuty Integration</span>
                    <span className="text-gray-500 text-[11px]">Trigger incident on critical schema failure</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPagerdutyEnabled(!pagerdutyEnabled);
                    showToast(`PagerDuty integration ${!pagerdutyEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    pagerdutyEnabled ? 'bg-slate-900' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                      pagerdutyEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">Datadog APM Metrics</span>
                    <span className="text-gray-500 text-[11px]">Stream blast radius events to Datadog</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDatadogEnabled(!datadogEnabled);
                    showToast(`Datadog APM metrics ${!datadogEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    datadogEnabled ? 'bg-slate-900' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                      datadogEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: API Keys & Tokens */}
      {activeTab === 'apikeys' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Active API Keys</h2>
                <p className="text-xs text-gray-500 mt-0.5">Use API keys to authenticate CI/CD pipelines and SDK requests</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGeneratedSecretToken(null);
                  setNewKeyName('');
                  setIsApiKeyModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New Key</span>
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

      {/* Tab 4: Team & RBAC */}
      {activeTab === 'team' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Team Members & Access Control</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage organization members and role permissions</p>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                    <th className="pb-3 pl-1">Member</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">2FA Security</th>
                    <th className="pb-3 pr-1 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-xs">{member.name}</span>
                            <span className="text-[11px] text-gray-500">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-gray-100 text-gray-800 border-gray-200">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {member.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Shield className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Disabled</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-1 text-right">
                        {member.role !== 'Owner' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(member.id, member.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions Breakdown Helper Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-gray-100 pb-2">
              Role Permissions Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-1">
                <span className="font-semibold text-slate-900">Admin</span>
                <span className="text-gray-500 leading-relaxed">
                  Full control over workspace settings, API tokens, integrations, guardrail policy rules, and member billing.
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-1">
                <span className="font-semibold text-slate-900">Engineer</span>
                <span className="text-gray-500 leading-relaxed">
                  Can execute simulations, inspect dependency topology, trigger dry-runs, and request migration approvals.
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-1">
                <span className="font-semibold text-slate-900">Viewer</span>
                <span className="text-gray-500 leading-relaxed">
                  Read-only access to executive compliance reports, audit trails, and risk analytics dashboards.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {generatedSecretToken ? 'API Token Secret Generated' : 'Generate New API Key'}
              </h3>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedSecretToken ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Copy this API secret key now. For security purposes, it will not be displayed again.
                  </span>
                </div>

                <div className="p-3 bg-slate-950 text-emerald-300 font-mono text-xs rounded-md border border-slate-800 break-all select-all flex items-center justify-between gap-2">
                  <span>{generatedSecretToken}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSecretToken);
                      showToast('Secret key copied to clipboard!');
                    }}
                    className="p-1 bg-slate-800 text-white rounded hover:bg-slate-700 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateKeySubmit} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Key Identifier Name</label>
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
                  <label className="font-semibold text-gray-700">Access Scope</label>
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as 'Full Access' | 'Read Only')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Full Access">Full Access (Read & Write)</option>
                    <option value="Read Only">Read Only (Audit Stream)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(false)}
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

      {/* Invite Team Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@changeshield.io"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Engineer' | 'Viewer')}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Engineer">Engineer (Run Simulations)</option>
                  <option value="Viewer">Viewer (Read Audit Logs)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
