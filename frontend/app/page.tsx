'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Play,
  Server,
  Database,
  GitFork,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight,
  Layers,
  Flame,
  Globe,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type SimulationStatus = 'Passed' | 'Blocked' | 'Needs Review';

export interface CommandSimulationItem {
  id: string;
  name: string;
  targetService: string;
  changeSummary: string;
  v1Sql?: string;
  v2Sql?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  status: SimulationStatus;
  executedTimestamp: string;
  affectedCount: number;
  affectedNodesList?: string[];
}

export interface ImpactedServiceItem {
  id: string;
  name: string;
  type: 'Service' | 'Database' | 'API Gateway';
  criticality: number;
  dependencyCount: number;
  riskScore: number;
}

const RECENT_SIMULATIONS_DATA: CommandSimulationItem[] = [
  {
    id: 'sim-8801',
    name: 'Migrate User Identifier to UUID',
    targetService: 'users-db / user-service',
    changeSummary: 'ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;',
    v1Sql: 'CREATE TABLE users (customer_id INT PRIMARY KEY, email VARCHAR(255));',
    v2Sql: 'ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;',
    riskLevel: 'Critical',
    riskScore: 8.6,
    status: 'Blocked',
    executedTimestamp: '12 mins ago',
    affectedCount: 5,
    affectedNodesList: ['user-service', 'auth-service', 'order-service', 'checkout-api', 'analytics-pipeline'],
  },
  {
    id: 'sim-8794',
    name: 'Add Payment Idempotency Column',
    targetService: 'payment-service',
    changeSummary: 'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);',
    v1Sql: 'CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2));',
    v2Sql: 'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);',
    riskLevel: 'Medium',
    riskScore: 3.2,
    status: 'Passed',
    executedTimestamp: '1 hour ago',
    affectedCount: 2,
    affectedNodesList: ['payment-service', 'stripe-webhook-gateway'],
  },
  {
    id: 'sim-8781',
    name: 'Drop Order Foreign Key Constraint',
    targetService: 'order-service',
    changeSummary: 'ALTER TABLE order_items DROP CONSTRAINT fk_orders_user;',
    v1Sql: 'ALTER TABLE order_items ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);',
    v2Sql: 'ALTER TABLE order_items DROP CONSTRAINT fk_orders_user;',
    riskLevel: 'High',
    riskScore: 6.8,
    status: 'Needs Review',
    executedTimestamp: '3 hours ago',
    affectedCount: 4,
    affectedNodesList: ['order-service', 'inventory-service', 'notification-service', 'db-orders'],
  },
  {
    id: 'sim-8762',
    name: 'Create Product Category Index',
    targetService: 'catalog-service',
    changeSummary: 'CREATE INDEX idx_products_category ON products(category_id);',
    v1Sql: '-- No index on category_id',
    v2Sql: 'CREATE INDEX idx_products_category ON products(category_id);',
    riskLevel: 'Low',
    riskScore: 1.4,
    status: 'Passed',
    executedTimestamp: '5 hours ago',
    affectedCount: 1,
    affectedNodesList: ['catalog-service'],
  },
  {
    id: 'sim-8740',
    name: 'Deprecate Legacy Events Table',
    targetService: 'analytics-pipeline',
    changeSummary: 'DROP TABLE legacy_user_events_2024;',
    v1Sql: 'CREATE TABLE legacy_user_events_2024 (id UUID PRIMARY KEY);',
    v2Sql: 'DROP TABLE legacy_user_events_2024;',
    riskLevel: 'Critical',
    riskScore: 9.1,
    status: 'Blocked',
    executedTimestamp: '1 day ago',
    affectedCount: 6,
    affectedNodesList: ['bi-dashboard', 'etl-exporter', 'user-behavior-service', 'data-lake-sync', 'warehouse-loader', 'reporting-api'],
  },
];

const HIGH_RISK_SERVICES_DATA: ImpactedServiceItem[] = [
  {
    id: 'srv-1',
    name: 'users-db (PostgreSQL)',
    type: 'Database',
    criticality: 5.0,
    dependencyCount: 8,
    riskScore: 8.6,
  },
  {
    id: 'srv-2',
    name: 'auth-service',
    type: 'Service',
    criticality: 4.8,
    dependencyCount: 6,
    riskScore: 7.4,
  },
  {
    id: 'srv-3',
    name: 'payment-gateway-api',
    type: 'API Gateway',
    criticality: 4.5,
    dependencyCount: 5,
    riskScore: 6.9,
  },
  {
    id: 'srv-4',
    name: 'order-processing-engine',
    type: 'Service',
    criticality: 4.2,
    dependencyCount: 4,
    riskScore: 5.8,
  },
];

export default function OverviewPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');

  // Slide-Over Detail Drawer State
  const [inspectItem, setInspectItem] = useState<CommandSimulationItem | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefreshArchitecture = async () => {
    setIsHealthChecking(true);
    const isOnline = await checkBackendHealth();
    setIsHealthChecking(false);
    setBackendStatus(isOnline ? 'Online' : 'Offline');
    triggerToast(
      isOnline
        ? 'Refreshed architecture. FastAPI engine http://localhost:8000 is 100% Operational.'
        : 'Refreshed architecture. Reached local cache mode.'
    );
  };

  useEffect(() => {
    handleRefreshArchitecture();
  }, []);

  const handleQuickLatestAnalysis = () => {
    setInspectItem(RECENT_SIMULATIONS_DATA[0]);
  };

  const getRiskBadgeStyle = (level: RiskLevel) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getStatusBadgeStyle = (status: SimulationStatus) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Needs Review':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
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

      {/* Header & Live System Health Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Command Center
            </h1>
            {backendStatus === 'Online' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Protected • 100% Operational
              </span>
            )}
            {backendStatus === 'Offline' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Backend Cache Mode Active
              </span>
            )}
            {backendStatus === 'Checking' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                Verifying Engine...
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Predict schema impact, trace dependency blast radius, and enforce architectural risk governance.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefreshArchitecture}
            disabled={isHealthChecking}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isHealthChecking ? 'animate-spin' : ''}`} />
            <span>Refresh Architecture</span>
          </button>

          <button
            type="button"
            onClick={handleQuickLatestAnalysis}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
            <span>Quick Latest Analysis</span>
          </button>

          <Link
            href="/simulations?openRunner=true"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>New Simulation</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Architecture Scope */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Architecture Scope</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">12 Services</span>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-600" /> 38 APIs
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" /> 6 DBs
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Risk Counter Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Risk Distribution</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">13</span>
              <span className="text-xs text-gray-500">Simulations run</span>
            </div>
            <div className="flex flex-col gap-1 items-end text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">1 Critical</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">3 High</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">5 Med</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">4 Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Protection Score */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Shield Protection Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">98.4%</span>
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +1.2% this week
            </span>
          </div>
        </div>

        {/* Card 4: Avg Blast Radius Traversal */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Avg. Blast Radius Impact</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
              <GitFork className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">2.4 Hops</span>
            <span className="text-xs text-gray-500 font-mono">~5.1 nodes / change</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (2/3 -> 8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Recent Simulations Table Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-900" />
                <h2 className="text-base font-semibold text-slate-900">Recent Change Simulations</h2>
              </div>
              <Link
                href="/simulations"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>View All Simulations</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                    <th className="pb-3 pl-1">Simulation Name & Target</th>
                    <th className="pb-3 px-3">Schema Change Summary</th>
                    <th className="pb-3 px-3">Risk Rating</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                    <th className="pb-3 pr-1 text-right">Executed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {RECENT_SIMULATIONS_DATA.map((sim) => (
                    <tr
                      key={sim.id}
                      onClick={() => setInspectItem(sim)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pl-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 text-xs">{sim.name}</span>
                          <span className="text-[11px] font-mono text-gray-500">{sim.targetService}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <span className="text-xs font-mono text-slate-800 truncate bg-gray-50 px-2 py-1 rounded border border-gray-200/80 block">
                          {sim.changeSummary}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded border ${getRiskBadgeStyle(
                            sim.riskLevel
                          )}`}
                        >
                          {sim.riskLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${getStatusBadgeStyle(
                            sim.status
                          )}`}
                        >
                          {sim.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectItem(sim);
                          }}
                          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 text-[11px] font-medium rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </td>

                      <td className="py-3.5 pr-1 text-right text-xs text-gray-500">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{sim.executedTimestamp}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active High-Risk Changes & Affected Components Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Critical Vulnerable & Dependent Components
                </h2>
              </div>
              <span className="text-xs text-gray-500">Sorted by risk criticality</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HIGH_RISK_SERVICES_DATA.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-gray-200 text-slate-700">
                      {srv.type === 'Database' && <Database className="w-4 h-4 text-emerald-600" />}
                      {srv.type === 'API Gateway' && <Globe className="w-4 h-4 text-sky-600" />}
                      {srv.type === 'Service' && <Server className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">{srv.name}</span>
                      <span className="text-[11px] text-gray-500">
                        {srv.dependencyCount} Downstream Dependent Services
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-rose-600">
                      Risk {srv.riskScore}
                    </span>
                    <span className="text-[10px] text-gray-400">Rating {srv.criticality}/5.0</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 -> 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Risk Distribution Donut Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Risk Categorization</h2>
              <p className="text-xs text-gray-500 mt-0.5">Across 13 evaluated changes</p>
            </div>

            <div className="flex items-center justify-center relative my-2">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500"
                  strokeDasharray="7.7, 100"
                  strokeDashoffset="0"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray="23, 100"
                  strokeDashoffset="-7.7"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray="38.5, 100"
                  strokeDashoffset="-30.7"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="30.8, 100"
                  strokeDashoffset="-69.2"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">13</span>
                <span className="text-xs text-gray-500">Evaluations</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-gray-600">Critical Risk</span>
                </div>
                <span className="font-semibold text-slate-900">1 (7.7%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-gray-600">High Risk</span>
                </div>
                <span className="font-semibold text-slate-900">3 (23.0%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Medium Risk</span>
                </div>
                <span className="font-semibold text-slate-900">5 (38.5%)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-600">Low Risk</span>
                </div>
                <span className="font-semibold text-slate-900">4 (30.8%)</span>
              </div>
            </div>
          </div>

          {/* Weekly Risk Evaluation Trend Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Weekly Blocked Ratio</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mon–Fri change evaluations vs blocks</p>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Mon (4 runs)</span>
                  <span className="font-medium text-slate-900">1 Blocked (25%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full w-[25%]" />
                  <div className="bg-emerald-500 h-full w-[75%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Tue (3 runs)</span>
                  <span className="font-medium text-slate-900">0 Blocked (0%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-[100%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Wed (5 runs)</span>
                  <span className="font-medium text-slate-900">2 Blocked (40%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full w-[40%]" />
                  <div className="bg-emerald-500 h-full w-[60%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Thu (2 runs)</span>
                  <span className="font-medium text-slate-900">0 Blocked (0%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-[100%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Fri (3 runs)</span>
                  <span className="font-medium text-slate-900">1 Blocked (33%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full w-[33%]" />
                  <div className="bg-emerald-500 h-full w-[67%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Quickstart Workflow Stepper Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">How ChangeShield Works</h2>
              <p className="text-xs text-gray-500 mt-0.5">End-to-end impact prediction workflow</p>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded border border-gray-200/80">
                <div className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Simulate Change</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Define schema DDL or target component modifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded border border-gray-200/80">
                <div className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Analyze Impact</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Trace downstream service & API dependency trees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded border border-gray-200/80">
                <div className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Assess Risk</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Calculate blast radius & guardrail policy violations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-gray-50 rounded border border-gray-200/80">
                <div className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Get Remediation</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Review actionable evidence traces & migration shims.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Over Inspection Drawer */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-white border-l border-gray-200 sm:border sm:rounded-xl shadow-2xl max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-gray-400">Simulation ID: {inspectItem.id}</span>
                <h3 className="text-base font-bold text-slate-900">{inspectItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="p-1 text-gray-400 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-gray-50 rounded border border-gray-200">
              <div>
                <span className="text-gray-500">Target Component:</span>
                <p className="font-semibold text-slate-900 font-mono">{inspectItem.targetService}</p>
              </div>
              <div>
                <span className="text-gray-500">Risk Score:</span>
                <p className="font-semibold text-rose-600 font-mono">{inspectItem.riskScore || 8.6} / 10.0 ({inspectItem.riskLevel})</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              <span className="font-semibold text-slate-900 font-sans">DDL Statement</span>
              <div className="p-3 bg-slate-950 text-emerald-300 rounded border border-slate-800 overflow-x-auto">
                {inspectItem.v2Sql || inspectItem.changeSummary}
              </div>
            </div>

            {inspectItem.affectedNodesList && inspectItem.affectedNodesList.length > 0 && (
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-semibold text-slate-900">Blast Radius Path ({inspectItem.affectedCount} Nodes)</span>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {inspectItem.affectedNodesList.map((node, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-gray-100 text-slate-800 rounded border border-gray-200 flex items-center gap-1">
                      {node}
                      {idx < inspectItem.affectedNodesList!.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400 ml-1" />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
