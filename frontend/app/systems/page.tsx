'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Upload,
  Database,
  Server,
  Globe,
  Network,
  GitBranch,
  Play,
  ArrowRight,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  Sparkles,
  FileText,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Cpu,
  Clock,
  Check,
} from 'lucide-react';
import SourceSelector from '@/components/systems/SourceSelector';
import FileUpload from '@/components/systems/FileUpload';
import { SourceType } from '@/lib/types';
import { checkBackendHealth } from '@/lib/api';

// --- Types for Systems Management ---
export type SystemSourceType = 'github' | 'postgres' | 'openapi' | 'file';
export type IngestStatus = 'Healthy' | 'Warning' | 'Analyzing';

export interface RegisteredSystem {
  id: string;
  name: string;
  sourceType: SystemSourceType;
  sourceLabel: string;
  repoUrl?: string;
  branch?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  status: IngestStatus;
  lastAnalyzed: string;
  metrics: {
    services: number;
    apis: number;
    databases: number;
    externalIntegrations: number;
  };
  componentsList: {
    services: { name: string; criticality: number; type: string }[];
    endpoints: { method: string; path: string; consumers: number }[];
    tables: { name: string; columnsCount: number }[];
  };
}

const DEFAULT_REGISTERED_SYSTEMS: RegisteredSystem[] = [
  {
    id: 'sys-ecom-core',
    name: 'E-Commerce Core Platform',
    sourceType: 'github',
    sourceLabel: 'GitHub App (org/ecom-core)',
    repoUrl: 'https://github.com/org/ecom-core',
    branch: 'main',
    lastCommitSha: '9b8c2f1',
    lastCommitMessage: 'feat(orders): update customer_id index & schema relations',
    status: 'Healthy',
    lastAnalyzed: '15 mins ago',
    metrics: {
      services: 8,
      apis: 12,
      databases: 4,
      externalIntegrations: 2,
    },
    componentsList: {
      services: [
        { name: 'user-service', criticality: 4.8, type: 'backend' },
        { name: 'order-service', criticality: 4.2, type: 'backend' },
        { name: 'auth-service', criticality: 5.0, type: 'backend' },
        { name: 'payment-service', criticality: 4.5, type: 'backend' },
      ],
      endpoints: [
        { method: 'POST', path: '/v1/users/register', consumers: 4 },
        { method: 'GET', path: '/v1/orders/{id}', consumers: 3 },
        { method: 'PUT', path: '/v2/payments/charge', consumers: 5 },
      ],
      tables: [
        { name: 'users', columnsCount: 14 },
        { name: 'orders', columnsCount: 18 },
        { name: 'payments', columnsCount: 12 },
      ],
    },
  },
  {
    id: 'sys-payment-gateway',
    name: 'Payment & Settlement Gateway',
    sourceType: 'postgres',
    sourceLabel: 'Live PostgreSQL Introspection',
    repoUrl: 'https://github.com/org/payment-gateway',
    branch: 'main',
    lastCommitSha: '4a1e9c8',
    lastCommitMessage: 'chore(db): add idempotency_key to payment_attempts',
    status: 'Healthy',
    lastAnalyzed: '1 hour ago',
    metrics: {
      services: 3,
      apis: 6,
      databases: 2,
      externalIntegrations: 3,
    },
    componentsList: {
      services: [
        { name: 'payment-service', criticality: 5.0, type: 'backend' },
        { name: 'stripe-gateway', criticality: 4.0, type: 'external' },
        { name: 'settlement-worker', criticality: 3.5, type: 'worker' },
      ],
      endpoints: [
        { method: 'POST', path: '/v2/charge', consumers: 6 },
        { method: 'POST', path: '/v1/refunds', consumers: 2 },
      ],
      tables: [
        { name: 'payments', columnsCount: 16 },
        { name: 'settlements', columnsCount: 10 },
      ],
    },
  },
  {
    id: 'sys-catalog-microservice',
    name: 'Catalog Microservice',
    sourceType: 'openapi',
    sourceLabel: 'OpenAPI 3.0 Spec',
    repoUrl: 'https://github.com/org/catalog-service',
    branch: 'main',
    lastCommitSha: '2d7f8a1',
    lastCommitMessage: 'refactor(api): update category_id payload types',
    status: 'Warning',
    lastAnalyzed: '3 hours ago',
    metrics: {
      services: 2,
      apis: 8,
      databases: 1,
      externalIntegrations: 1,
    },
    componentsList: {
      services: [
        { name: 'catalog-service', criticality: 3.8, type: 'backend' },
        { name: 'inventory-worker', criticality: 3.0, type: 'worker' },
      ],
      endpoints: [
        { method: 'GET', path: '/v1/products', consumers: 5 },
        { method: 'POST', path: '/v1/products/category', consumers: 2 },
      ],
      tables: [{ name: 'products', columnsCount: 22 }],
    },
  },
  {
    id: 'sys-order-engine',
    name: 'Order Processing Engine',
    sourceType: 'file',
    sourceLabel: 'SQL DDL Schema File',
    repoUrl: 'https://github.com/org/order-engine',
    branch: 'main',
    lastCommitSha: 'f8101a2',
    lastCommitMessage: 'feat(ddl): add foreign key fk_orders_user to order_items',
    status: 'Analyzing',
    lastAnalyzed: 'Just now',
    metrics: {
      services: 5,
      apis: 9,
      databases: 3,
      externalIntegrations: 1,
    },
    componentsList: {
      services: [
        { name: 'order-service', criticality: 4.5, type: 'backend' },
        { name: 'fulfillment-processor', criticality: 3.8, type: 'worker' },
      ],
      endpoints: [{ method: 'POST', path: '/v1/orders/checkout', consumers: 6 }],
      tables: [{ name: 'order_items', columnsCount: 15 }],
    },
  },
];

// --- 7-Step Walkthrough Data ---
const PRODUCT_FLOW_STEPS = [
  {
    step: 1,
    title: 'Connect System',
    subtitle: 'Ingest a GitHub repo, SQL schema, OpenAPI spec, or service metadata file.',
    icon: Upload,
    engineDetail: 'ChangeShield parses repository structure, extracts service imports, FK constraints from SQL, and endpoint definitions from OpenAPI — building a normalized entity graph.',
  },
  {
    step: 2,
    title: 'Analyze Dependencies',
    subtitle: 'The engine parses all code imports, FK relationships, and API consumers to build the dependency graph.',
    icon: Network,
    engineDetail: 'Graph is built using a directed adjacency list. Each edge encodes dependency type (FK, import, HTTP call) and criticality weight.',
  },
  {
    step: 3,
    title: 'Select / Detect Change',
    subtitle: 'Developer submits a DDL ALTER TABLE, config diff, or API endpoint modification.',
    icon: FileText,
    engineDetail: 'Changes are diffed against the current schema snapshot. DDL ALTER statements on indexed/FK columns are flagged as potentially breaking changes.',
  },
  {
    step: 4,
    title: 'Trace Impact',
    subtitle: 'The engine traverses the graph and illuminates every upstream and downstream component affected.',
    icon: ArrowRight,
    engineDetail: 'BFS traversal starts at the changed node and follows all outgoing and incoming edges. Transitive dependencies are flagged up to the configured max hop depth.',
  },
  {
    step: 5,
    title: 'Risk Score',
    subtitle: 'A weighted formula calculates Blast Radius Score (0–10) from depth, affected count, criticality, and external exposure.',
    icon: Shield,
    engineDetail: 'Risk = Σ(weight_i × factor_i). Scores ≥ 8.0 trigger automatic CI/CD PR block. Scores 6.0–7.9 require architectural review.',
  },
  {
    step: 6,
    title: 'Evidence',
    subtitle: 'Returns dependency traversal paths, triggered policy violations, and the complete list of affected services.',
    icon: Sliders,
    engineDetail: 'Evidence is persisted as a structured audit trail with timestamps, rule IDs, and dependency edge metadata for compliance reporting.',
  },
  {
    step: 7,
    title: 'Remediation',
    subtitle: 'A safe migration playbook with step-by-step actions, testing recommendations, and rollout strategy.',
    icon: CheckCircle2,
    engineDetail: 'Remediation plans are generated from rule templates mapped to the triggered policy violation type. Each playbook step is linked to a test recommendation.',
  },
];

export default function SystemsPage() {
  const [systems, setSystems] = useState<RegisteredSystem[]>(DEFAULT_REGISTERED_SYSTEMS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Walkthrough Active Step State
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState(1);

  // Inspector Drawer State
  const [inspectSystem, setInspectRecordSystem] = useState<RegisteredSystem | null>(null);

  // Ingestion Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType>('github');
  const [inputName, setInputName] = useState('');
  const [repoUrl, setRepoUrl] = useState('https://github.com/org/new-service');
  const [rawSql, setRawSql] = useState('CREATE TABLE example (id INT PRIMARY KEY);');
  const [, setUploadedFile] = useState<File | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Scope KPI Totals
  const totalScope = useMemo(() => {
    let services = 0;
    let apis = 0;
    let databases = 0;

    systems.forEach((s) => {
      services += s.metrics.services;
      apis += s.metrics.apis;
      databases += s.metrics.databases;
    });

    return { registeredCount: systems.length, services, apis, databases };
  }, [systems]);

  const currentWalkthroughData = useMemo(
    () => PRODUCT_FLOW_STEPS.find((s) => s.step === activeWalkthroughStep) || PRODUCT_FLOW_STEPS[0],
    [activeWalkthroughStep]
  );

  const handleReanalyzeSingle = (id: string, name: string) => {
    setSystems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Analyzing' } : s))
    );
    showToast(`Started architecture re-analysis for ${name}...`);

    setTimeout(() => {
      setSystems((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: 'Healthy', lastAnalyzed: 'Just now' } : s
        )
      );
      showToast(`Re-analysis complete for ${name}. Topology refreshed.`);
    }, 1200);
  };

  const handleReanalyzeAll = async () => {
    const isOnline = await checkBackendHealth();
    showToast(
      isOnline
        ? 'Re-analyzed all 4 system topologies via FastAPI backend.'
        : 'Re-analyzed all 4 system topologies (Local Cache Mode).'
    );

    setSystems((prev) =>
      prev.map((s) => ({
        ...s,
        lastAnalyzed: 'Just now',
        status: 'Healthy',
      }))
    );
  };

  const handleDeleteSystem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to unlink system architecture "${name}"?`)) {
      setSystems((prev) => prev.filter((s) => s.id !== id));
      showToast(`Unlinked system "${name}".`);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingImport(true);

    setTimeout(() => {
      setIsSubmittingImport(false);
      setIsImportModalOpen(false);

      const newSystem: RegisteredSystem = {
        id: `sys-${Date.now().toString().slice(-4)}`,
        name: inputName.trim() || 'Custom Ingested Service',
        sourceType: (selectedSourceType === 'services_json' ? 'file' : selectedSourceType) as SystemSourceType,
        sourceLabel:
          selectedSourceType === 'github'
            ? 'GitHub App'
            : selectedSourceType === 'sql'
            ? 'SQL Schema Upload'
            : selectedSourceType === 'openapi'
            ? 'OpenAPI Spec'
            : 'Custom Ingestion',
        repoUrl: repoUrl,
        branch: 'main',
        lastCommitSha: 'a1b2c3d',
        lastCommitMessage: 'initial architecture discovery and ingestion',
        status: 'Healthy',
        lastAnalyzed: 'Just now',
        metrics: {
          services: 4,
          apis: 8,
          databases: 1,
          externalIntegrations: 1,
        },
        componentsList: {
          services: [{ name: 'ingested-service', criticality: 4.0, type: 'backend' }],
          endpoints: [{ method: 'POST', path: '/v1/process', consumers: 2 }],
          tables: [{ name: 'ingested_table', columnsCount: 8 }],
        },
      };

      setSystems((prev) => [newSystem, ...prev]);
      showToast(`Successfully imported and analyzed system "${newSystem.name}".`);
      setInputName('');
    }, 1000);
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

      {/* SECTION A — "How ChangeShield Works" Interactive 7-Step Product Flow (TOP) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                How ChangeShield Works
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Interactive 7-step walkthrough of automated system ingestion, AST diff parsing, and risk gating.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-gray-200 w-fit">
            End-to-End Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR — Vertical Numbered Step Pills (1-7) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5 border-r-0 lg:border-r border-gray-100 pr-0 lg:pr-4">
            {PRODUCT_FLOW_STEPS.map((stepItem) => {
              const IconComp = stepItem.icon;
              const isActive = activeWalkthroughStep === stepItem.step;

              return (
                <button
                  key={stepItem.step}
                  type="button"
                  onClick={() => setActiveWalkthroughStep(stepItem.step)}
                  className={`w-full p-2.5 rounded-lg text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-slate-800 text-white' : 'bg-gray-200 text-slate-700'
                    }`}
                  >
                    {stepItem.step}
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-xs truncate">{stepItem.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0 ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* RIGHT PANEL — Rich Content Card for Active Step */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                  STEP {currentWalkthroughData.step} OF 7
                </span>
                <h3 className="text-base font-bold text-slate-900">{currentWalkthroughData.title}</h3>
              </div>
              <p className="text-xs text-gray-600">{currentWalkthroughData.subtitle}</p>
            </div>

            {/* STEP SPECIFIC VISUAL ILLUSTRATIONS */}
            <div className="min-h-[240px] p-5 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col justify-center gap-4">
              {/* Step 1 Visual */}
              {activeWalkthroughStep === 1 && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <GitBranch className="w-4 h-4 text-slate-900" />
                      <span className="font-semibold text-slate-900">GitHub Repository</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Connected
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-900">PostgreSQL Database</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      Healthy
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-slate-900">OpenAPI Spec</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Connected
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-900">SQL Schema File</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      Analyzing
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2 Visual */}
              {activeWalkthroughStep === 2 && (
                <div className="flex flex-col gap-4 items-center justify-center font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      db-users
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      user-service
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      auth-service
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="px-3.5 py-2 bg-sky-50 border border-sky-200 text-sky-900 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      api-gateway
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-sans">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>auth-service also calls:</span>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-mono font-semibold">
                      order-service
                    </span>
                  </div>
                </div>
              )}

              {/* Step 3 Visual */}
              {activeWalkthroughStep === 3 && (
                <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-lg border border-slate-800 flex gap-4">
                  <div className="flex flex-col text-slate-600 select-none text-right pr-2 border-r border-slate-800 font-semibold">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-x-auto">
                    <span className="text-slate-500">// Proposed Schema Change</span>
                    <span className="text-indigo-400 font-bold border-l-2 border-amber-400 pl-2">ALTER TABLE users</span>
                    <span className="text-slate-200 border-l-2 border-amber-400 pl-2">  ALTER COLUMN customer_id</span>
                    <span className="text-emerald-400 font-bold border-l-2 border-amber-400 pl-2">  TYPE UUID</span>
                    <span className="text-slate-200 border-l-2 border-amber-400 pl-2">  USING customer_id::UUID;</span>
                    <span></span>
                    <span className="text-amber-400 font-semibold">// Breaking: changes primary key column type</span>
                  </div>
                </div>
              )}

              {/* Step 4 Visual */}
              {activeWalkthroughStep === 4 && (
                <div className="flex flex-col gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto p-3 bg-white rounded-lg border border-amber-200 shadow-2xs">
                    <div className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded ring-2 ring-rose-400/30 animate-pulse shrink-0">
                      db-users
                    </div>
                    <span className="text-amber-600 font-sans text-[10px] font-bold">Hop 1 →</span>
                    <div className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded ring-2 ring-rose-400/30 animate-pulse shrink-0">
                      user-service
                    </div>
                    <span className="text-amber-600 font-sans text-[10px] font-bold">Hop 2 →</span>
                    <div className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded ring-2 ring-rose-400/30 animate-pulse shrink-0">
                      auth-service
                    </div>
                    <span className="text-amber-600 font-sans text-[10px] font-bold">Hop 3 →</span>
                    <div className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded ring-2 ring-rose-400/30 animate-pulse shrink-0">
                      checkout-api
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <span className="text-xs font-semibold font-sans bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                      5 components impacted across 3 hops
                    </span>
                  </div>
                </div>
              )}

              {/* Step 5 Visual */}
              {activeWalkthroughStep === 5 && (
                <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-5xl font-extrabold text-slate-900 tracking-tight font-mono">8.6 / 10.0</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">Weighted Blast Radius Score</span>
                    </div>
                    <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold rounded text-xs tracking-wider">
                      CRITICAL RISK
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[86%]" />
                  </div>

                  <div className="grid grid-cols-1 font-mono text-[11px] gap-1 pt-1 border-t border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span className="font-sans">Dependency Depth</span>
                      <span className="font-bold text-slate-900">30% | ████████░░</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-sans">Affected Nodes</span>
                      <span className="font-bold text-slate-900">25% | ██████░░░░</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-sans">External Exposure</span>
                      <span className="font-bold text-slate-900">20% | █████░░░░░</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-sans">Component Criticality</span>
                      <span className="font-bold text-slate-900">15% | ████░░░░░░</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="font-sans">Change Severity</span>
                      <span className="font-bold text-slate-900">10% | ██░░░░░░░░</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6 Visual */}
              {activeWalkthroughStep === 6 && (
                <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-lg border border-slate-800 flex flex-col gap-2">
                  <span className="text-emerald-400 font-bold font-sans">TRAVERSAL PATHS</span>
                  <p className="text-slate-300">Trace #1: db-users → user-service → auth-service → checkout-api</p>
                  <p className="text-slate-300">Trace #2: db-users → user-service → order-service → checkout-api</p>
                  <p className="text-slate-300">Trace #3: db-users → user-service → analytics-pipeline</p>

                  <span className="text-rose-400 font-bold font-sans mt-2">POLICY VIOLATIONS</span>
                  <p className="text-rose-300">[BLOCK] Rule: Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB</p>
                  <p className="text-amber-300">[WARN]  Rule: High Blast Radius Traversal Detected (&gt;3 Hops)</p>

                  <span className="text-amber-400 font-bold font-sans mt-2">IMPACTED SERVICES</span>
                  <p className="text-slate-200">user-service | auth-service | order-service | checkout-api | analytics-pipeline</p>
                </div>
              )}

              {/* Step 7 Visual */}
              {activeWalkthroughStep === 7 && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Step 1: Apply Dual-Write Expand/Contract Schema Shim</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-gray-200">
                        Deploy Compatibility Migration
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">Add customer_id_uuid alongside customer_id without altering original column type.</p>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Step 2: Update Downstream ORM Models</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-gray-200">
                        Sync Microservice Models
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">Update user-service and order-service query adapters to accept stringified UUIDs.</p>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Step 3: API Gateway Deprecation Header</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-gray-200">
                        Deploy Gateway Facade
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">Inject Sunset HTTP headers on legacy INT endpoints prior to cutover.</p>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex flex-col gap-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Recommended Tests:
                    </span>
                    <ul className="list-disc pl-5 text-[11px] text-emerald-800 space-y-0.5">
                      <li>Run integration test suite across order-service and auth-service.</li>
                      <li>Execute staging dual-write canary regression test.</li>
                      <li>Verify API gateway contract validations for UUID request payload headers.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Technical Detail Callout */}
            <div className="p-3.5 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 flex items-start gap-2.5 shadow-2xs">
              <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white font-sans">Engine Internal Action:</span>{' '}
                <span className="text-slate-300">{currentWalkthroughData.engineDetail}</span>
              </div>
            </div>

            {/* NAVIGATION CONTROLS BELOW WALKTHROUGH */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={activeWalkthroughStep === 1}
                onClick={() => setActiveWalkthroughStep((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-slate-900 rounded font-medium transition-colors cursor-pointer"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">
                  Step {activeWalkthroughStep} of 7
                </span>
                <button
                  type="button"
                  onClick={() => setActiveWalkthroughStep(1)}
                  className="text-gray-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                >
                  Start Over
                </button>
              </div>

              <button
                type="button"
                disabled={activeWalkthroughStep === 7}
                onClick={() => setActiveWalkthroughStep((prev) => Math.min(prev + 1, 7))}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B — Connected Systems & Architecture Sources */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Connected Systems & Architecture Sources
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ingested software repositories, databases, and API specs monitored by ChangeShield.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add System</span>
          </button>
        </div>

        {/* Scope KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Registered Architectures</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {totalScope.registeredCount} Systems
              </span>
              <span className="text-xs text-gray-500">Active Sync</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Discovered Services</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {totalScope.services} Services
              </span>
              <span className="text-xs text-gray-500">Microservices</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Monitored Endpoints</span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-md border border-sky-100">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {totalScope.apis} APIs
              </span>
              <span className="text-xs text-gray-500">HTTP/REST</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Managed Databases</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {totalScope.databases} DBs
              </span>
              <span className="text-xs text-gray-500">Relational & Lake</span>
            </div>
          </div>
        </div>

        {/* Systems Registry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systems.map((sys) => (
            <div
              key={sys.id}
              className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col justify-between gap-5 shadow-2xs hover:border-gray-300 transition-colors"
            >
              {/* Top Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      {sys.name}
                    </h3>
                    {sys.status === 'Healthy' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
                      </span>
                    )}
                    {sys.status === 'Warning' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
                      </span>
                    )}
                    {sys.status === 'Analyzing' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" /> Syncing...
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-gray-400" />
                    {sys.sourceLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleReanalyzeSingle(sys.id, sys.name)}
                    title="Re-analyze System Topology"
                    className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSystem(sys.id, sys.name)}
                    title="Unlink System"
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Commit / Source Snippet */}
              {sys.lastCommitMessage && (
                <div className="p-3 bg-gray-50 rounded border border-gray-200/80 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>SHA: {sys.lastCommitSha}</span>
                    <span>Branch: {sys.branch}</span>
                  </div>
                  <p className="text-slate-800 font-medium truncate">&quot;{sys.lastCommitMessage}&quot;</p>
                </div>
              )}

              {/* Discovered Component Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200/60 flex flex-col">
                  <span className="text-base font-bold text-slate-900">{sys.metrics.services}</span>
                  <span className="text-[10px] font-medium text-gray-500">Services</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200/60 flex flex-col">
                  <span className="text-base font-bold text-slate-900">{sys.metrics.apis}</span>
                  <span className="text-[10px] font-medium text-gray-500">APIs</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200/60 flex flex-col">
                  <span className="text-base font-bold text-slate-900">{sys.metrics.databases}</span>
                  <span className="text-[10px] font-medium text-gray-500">DBs</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200/60 flex flex-col">
                  <span className="text-base font-bold text-slate-900">{sys.metrics.externalIntegrations}</span>
                  <span className="text-[10px] font-medium text-gray-500">External</span>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  Synced {sys.lastAnalyzed}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectRecordSystem(sys)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded font-medium transition-colors cursor-pointer"
                  >
                    View Components
                  </button>

                  <Link
                    href="/dependencies"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition-colors flex items-center gap-1"
                  >
                    <span>Graph</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Modal Ingestion Dialog */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-xl w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-98 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Import / Connect Architecture System</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">System Display Name</label>
                <input
                  type="text"
                  required
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Identity & Auth Microservice Cluster"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Source Selector Provider Chips */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Ingestion Provider Source</label>
                <SourceSelector
                  selectedSource={selectedSourceType}
                  onSelectSource={(src) => setSelectedSourceType(src)}
                />
              </div>

              {/* Form Input fields based on selected provider */}
              {selectedSourceType === 'github' && (
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-700">GitHub Repository URL</label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              {selectedSourceType === 'sql' && (
                <FileUpload
                  acceptedExtensions={['.sql']}
                  onFileSelected={(file: File | null) => setUploadedFile(file)}
                />
              )}

              {selectedSourceType === 'openapi' && (
                <FileUpload
                  acceptedExtensions={['.json', '.yaml', '.yml']}
                  onFileSelected={(file: File | null) => setUploadedFile(file)}
                />
              )}

              {selectedSourceType === 'services_json' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Raw DDL / YAML Specification</label>
                  <textarea
                    rows={3}
                    value={rawSql}
                    onChange={(e) => setRawSql(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingImport}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  {isSubmittingImport ? 'Analyzing System...' : 'Import & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discovered Components Inspector Drawer */}
      {inspectSystem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-white border-l border-gray-200 sm:border sm:rounded-xl shadow-2xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-gray-400">System ID: {inspectSystem.id}</span>
                <h3 className="text-base font-bold text-slate-900">{inspectSystem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecordSystem(null)}
                className="p-1 text-gray-400 hover:text-slate-900 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Discovered Microservices */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900">Discovered Services ({inspectSystem.componentsList.services.length})</h4>
              <div className="grid grid-cols-1 gap-2">
                {inspectSystem.componentsList.services.map((srv, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 font-mono">{srv.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 capitalize">{srv.type}</span>
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium">
                        Crit: {srv.criticality}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exposed Endpoints */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900">Exposed API Endpoints ({inspectSystem.componentsList.endpoints.length})</h4>
              <div className="grid grid-cols-1 gap-2">
                {inspectSystem.componentsList.endpoints.map((ep, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white font-bold rounded text-[10px]">{ep.method}</span>
                      <span className="text-slate-900">{ep.path}</span>
                    </div>
                    <span className="text-gray-500 font-sans">{ep.consumers} consumers</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Tables */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900">Associated Database Tables ({inspectSystem.componentsList.tables.length})</h4>
              <div className="grid grid-cols-1 gap-2">
                {inspectSystem.componentsList.tables.map((tbl, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 font-mono">{tbl.name}</span>
                    <span className="text-gray-500">{tbl.columnsCount} columns</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRecordSystem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
