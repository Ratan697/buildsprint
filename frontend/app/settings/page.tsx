'use client';

import React, { useState } from 'react';
import {
  Settings,
  Key,
  Webhook,
  Users,
  Plus,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Engineer' | 'Viewer';
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Ratan (Owner)', email: 'ratan@changeshield.dev', role: 'Admin' },
  { id: 'm2', name: 'Sarah Connor', email: 'sarah@changeshield.dev', role: 'Engineer' },
  { id: 'm3', name: 'John Doe', email: 'john@changeshield.dev', role: 'Viewer' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'api' | 'team'>('profile');

  // Workspace settings
  const [workspaceName, setWorkspaceName] = useState('ChangeShield Engineering');
  const [activeEnv, setActiveEnv] = useState<'production' | 'staging' | 'dev'>('production');

  // API Key state
  const [apiKey, setApiKey] = useState('cs_live_98f7a23b8e4c12d90a567812e');
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhooks
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');

  // Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);

  const rotateApiKey = () => {
    const newKey = `cs_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Platform Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage workspace settings, environment guardrails, webhooks, API tokens, and team access.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Workspace Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Integrations & Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'team'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Access</span>
          </button>
        </div>

        {/* Workspace Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Active Environment Target
              </label>
              <select
                value={activeEnv}
                onChange={(e) => setActiveEnv(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="production">Production (Strict Guardrails)</option>
                <option value="staging">Staging (Moderate Audit)</option>
                <option value="dev">Development (Permissive)</option>
              </select>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Slack Notifications Webhook URL
              </label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {/* API Credentials Tab */}
        {activeTab === 'api' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ChangeShield API Bearer Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 font-mono bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
                <button
                  onClick={copyKeyToClipboard}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={rotateApiKey}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Rotate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Access Tab */}
        {activeTab === 'team' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-semibold text-slate-900">
                Team Members ({teamMembers.length})
              </span>
              <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
            </div>

            <ul className="divide-y divide-slate-200">
              {teamMembers.map((member) => (
                <li key={member.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-slate-400 text-[11px]">{member.email}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 rounded font-semibold text-slate-700">
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
