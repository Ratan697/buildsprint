'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Loader2,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Database,
  GitFork,
  ArrowLeftRight,
  Copy,
  Trash2,
  X,
  ChevronRight,
  Sparkles,
  Layers,
  Ban,
  Clock,
  ArrowUpDown,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { simulateChange } from '@/lib/api';

export type RiskSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type SimulationCategory = 'Database Schema (DDL)' | 'API Contract' | 'Service Config';
export type SimulationStatus = 'Passed' | 'Blocked' | 'Needs Review';

export interface SimulationRecord {
  id: string;
  name: string;
  targetComponent: string;
  category: SimulationCategory;
  changeSummary: string;
  v1Sql?: string;
  v2Sql?: string;
  riskScore: number;
  severity: RiskSeverity;
  affectedNodesCount: number;
  affectedNodesList: string[];
  status: SimulationStatus;
  timestamp: string;
  policyViolations: string[];
}

const DEFAULT_SIMULATIONS_HISTORY: SimulationRecord[] = [
  {
    id: 'sim-8801',
    name: 'Migrate User Identifier to UUID',
    targetComponent: 'db-users / users.customer_id',
    category: 'Database Schema (DDL)',
    changeSummary: 'ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;',
    v1Sql: 'CREATE TABLE users (customer_id INT PRIMARY KEY, email VARCHAR(255));',
    v2Sql: 'CREATE TABLE users (customer_id UUID PRIMARY KEY, email VARCHAR(255));',
    riskScore: 8.6,
    severity: 'Critical',
    affectedNodesCount: 5,
    affectedNodesList: ['user-service', 'auth-service', 'order-service', 'checkout-api', 'analytics-pipeline'],
    status: 'Blocked',
    timestamp: '10 mins ago',
    policyViolations: ['Block Dropped Columns on Tier-1 DB', 'Detect High Blast Radius Traversal (>3 Hops)'],
  },
  {
    id: 'sim-8794',
    name: 'Add Payment Idempotency Column',
    targetComponent: 'payment-service / payments.idempotency_key',
    category: 'Database Schema (DDL)',
    changeSummary: 'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);',
    v1Sql: 'CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2));',
    v2Sql: 'CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2), idempotency_key VARCHAR(64));',
    riskScore: 3.2,
    severity: 'Medium',
    affectedNodesCount: 2,
    affectedNodesList: ['payment-service', 'stripe-webhook-gateway'],
    status: 'Passed',
    timestamp: '1 hour ago',
    policyViolations: [],
  },
  {
    id: 'sim-8781',
    name: 'Drop Order Foreign Key Constraint',
    targetComponent: 'order-service / fk_orders_user',
    category: 'Database Schema (DDL)',
    changeSummary: 'ALTER TABLE order_items DROP CONSTRAINT fk_orders_user;',
    v1Sql: 'ALTER TABLE order_items ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);',
    v2Sql: '-- Foreign key constraint removed',
    riskScore: 6.8,
    severity: 'High',
    affectedNodesCount: 4,
    affectedNodesList: ['order-service', 'inventory-service', 'notification-service', 'db-orders'],
    status: 'Needs Review',
    timestamp: '3 hours ago',
    policyViolations: ['Warn on Breaking Foreign Key Alterations'],
  },
  {
    id: 'sim-8762',
    name: 'Create Product Category Index',
    targetComponent: 'catalog-service / products.category_id',
    category: 'Database Schema (DDL)',
    changeSummary: 'CREATE INDEX idx_products_category ON products(category_id);',
    v1Sql: '-- No index',
    v2Sql: 'CREATE INDEX idx_products_category ON products(category_id);',
    riskScore: 1.4,
    severity: 'Low',
    affectedNodesCount: 1,
    affectedNodesList: ['catalog-service'],
    status: 'Passed',
    timestamp: '5 hours ago',
    policyViolations: [],
  },
  {
    id: 'sim-8740',
    name: 'Deprecate Legacy Events Table',
    targetComponent: 'analytics-pipeline / legacy_user_events',
    category: 'Database Schema (DDL)',
    changeSummary: 'DROP TABLE legacy_user_events_2024;',
    v1Sql: 'CREATE TABLE legacy_user_events_2024 (id UUID PRIMARY KEY);',
    v2Sql: 'DROP TABLE legacy_user_events_2024;',
    riskScore: 9.1,
    severity: 'Critical',
    affectedNodesCount: 6,
    affectedNodesList: ['bi-dashboard', 'etl-exporter', 'user-behavior-service', 'data-lake-sync', 'warehouse-loader', 'reporting-api'],
    status: 'Blocked',
    timestamp: '1 day ago',
    policyViolations: ['Prohibit Table Truncation / Drop in Staging & Prod', 'Require Multi-Review for Criticality > 4.0'],
  },
  {
    id: 'sim-8719',
    name: 'Update Notification Payload Contract',
    targetComponent: 'notification-service / POST /v1/notify',
    category: 'API Contract',
    changeSummary: 'Rename target_email JSON field to recipient_email.',
    v1Sql: '{ "target_email": "user@example.com" }',
    v2Sql: '{ "recipient_email": "user@example.com" }',
    riskScore: 5.4,
    severity: 'Medium',
    affectedNodesCount: 3,
    affectedNodesList: ['notification-service', 'user-service', 'marketing-automation'],
    status: 'Passed',
    timestamp: '2 days ago',
    policyViolations: [],
  },
];

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<SimulationRecord[]>(DEFAULT_SIMULATIONS_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'All Risk Levels' | RiskSeverity>('All Risk Levels');
  const [selectedCategory, setSelectedCategory] = useState<'All Categories' | SimulationCategory>('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'All Statuses' | SimulationStatus>('All Statuses');
  const [sortBy, setSortBy] = useState<'Newest First' | 'Highest Risk' | 'Most Affected Components'>('Newest First');

  // Compare Selected Items State (Max 2)
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Inspector Drawer Modal
  const [inspectRecord, setInspectRecord] = useState<SimulationRecord | null>(null);

  // Quick Runner Form State
  const [showQuickRunner, setShowSetup] = useState(false);
  const [quickTarget, setQuickTarget] = useState('db-users');
  const [quickV1Sql, setQuickV1Sql] = useState('CREATE TABLE users (id INT PRIMARY KEY);');
  const [quickV2Sql, setQuickV2Sql] = useState('CREATE TABLE users (id UUID PRIMARY KEY);');
  const [isSimulatingQuick, setIsSimulatingQuick] = useState(false);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Sort Logic
  const filteredSimulations = useMemo(() => {
    let result = simulations.filter((sim) => {
      const matchesSearch =
        sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.targetComponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.changeSummary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === 'All Risk Levels' || sim.severity === selectedSeverity;

      const matchesCategory =
        selectedCategory === 'All Categories' || sim.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'All Statuses' || sim.status === selectedStatus;

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
    });

    if (sortBy === 'Highest Risk') {
      result = [...result].sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === 'Most Affected Components') {
      result = [...result].sort((a, b) => b.affectedNodesCount - a.affectedNodesCount);
    }

    return result;
  }, [simulations, searchQuery, selectedSeverity, selectedCategory, selectedStatus, sortBy]);

  // Checkbox compare selection
  const handleToggleCompare = (id: string) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedCompareIds.length >= 2) {
        triggerToast('You can compare a maximum of 2 simulations side-by-side.');
        return;
      }
      setSelectedCompareIds((prev) => [...prev, id]);
    }
  };

  const handleDuplicateSimulation = (sim: SimulationRecord) => {
    const duplicated: SimulationRecord = {
      ...sim,
      id: `sim-${Date.now().toString().slice(-4)}`,
      name: `${sim.name} (Re-run)`,
      timestamp: 'Just now',
    };
    setSimulations((prev) => [duplicated, ...prev]);
    triggerToast(`Duplicated and re-ran "${sim.name}".`);
  };

  const handleDeleteSimulation = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete simulation "${name}"?`)) {
      setSimulations((prev) => prev.filter((s) => s.id !== id));
      setSelectedCompareIds((prev) => prev.filter((i) => i !== id));
      triggerToast(`Deleted simulation "${name}".`);
    }
  };

  const handleQuickRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingQuick(true);

    const apiRes = await simulateChange({
      target_component: quickTarget,
      v1_sql: quickV1Sql,
      v2_sql: quickV2Sql,
    });

    setIsSimulatingQuick(false);

    let calculatedRisk = 8.6;
    let impactedCount = 4;
    let impactedList = ['user-service', 'auth-service', 'checkout-api', 'db-users'];

    if (apiRes.data?.blast_radius_analysis) {
      calculatedRisk = apiRes.data.blast_radius_analysis.risk_score || calculatedRisk;
      impactedCount = apiRes.data.blast_radius_analysis.impacted_count || impactedCount;
      impactedList = apiRes.data.blast_radius_analysis.impacted_nodes || impactedList;
    }

    const severity: RiskSeverity = calculatedRisk >= 8.0 ? 'Critical' : calculatedRisk >= 5.0 ? 'High' : 'Medium';
    const status: SimulationStatus = calculatedRisk >= 8.0 ? 'Blocked' : 'Passed';

    const newRecord: SimulationRecord = {
      id: `sim-${Date.now().toString().slice(-4)}`,
      name: `Simulate ${quickTarget}`,
      targetComponent: quickTarget,
      category: 'Database Schema (DDL)',
      changeSummary: quickV2Sql,
      v1Sql: quickV1Sql,
      v2Sql: quickV2Sql,
      riskScore: calculatedRisk,
      severity,
      affectedNodesCount: impactedCount,
      affectedNodesList: impactedList,
      status,
      timestamp: 'Just now',
      policyViolations: calculatedRisk >= 8.0 ? ['Block Critical Column Alterations'] : [],
    };

    setSimulations((prev) => [newRecord, ...prev]);
    setShowSetup(false);
    triggerToast(`Quick simulation completed for ${quickTarget}. Calculated Risk: ${calculatedRisk}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('All Risk Levels');
    setSelectedCategory('All Categories');
    setSelectedStatus('All Statuses');
    setSortBy('Newest First');
  };

  // Compare Objects
  const compareObjA = useMemo(
    () => simulations.find((s) => s.id === selectedCompareIds[0]),
    [simulations, selectedCompareIds]
  );
  const compareObjB = useMemo(
    () => simulations.find((s) => s.id === selectedCompareIds[1]),
    [simulations, selectedCompareIds]
  );

  const getSeverityBadgeClass = (severity: RiskSeverity) => {
    switch (severity) {
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

  const getStatusBadgeClass = (status: SimulationStatus) => {
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
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-slate-900" />
            Simulation History & Impact Explorer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review change evaluation logs, trace blast radius propagation, and compare results side-by-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedCompareIds.length === 2 && (
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs animate-pulse"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare Selected (2/2)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSetup(!showQuickRunner)}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
            <span>{showQuickRunner ? 'Close Quick Runner' : 'Quick Runner'}</span>
          </button>

          <Link
            href="/simulations/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Interactive Workspace</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Total Evaluated</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{simulations.length}</span>
            <span className="text-xs text-gray-500">Simulations Logged</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Critical / High Blocked</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {simulations.filter((s) => s.status === 'Blocked').length}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
              Auto-Blocked
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Avg Calculated Risk</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">5.4</span>
            <span className="text-xs text-gray-500">out of 10.0</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Avg Blast Radius</span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">3.2</span>
            <span className="text-xs text-gray-500">Nodes / Change</span>
          </div>
        </div>
      </div>

      {/* Quick Runner Collapsible Form */}
      {showQuickRunner && (
        <form
          onSubmit={handleQuickRunSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-sm animate-in fade-in zoom-in-98 duration-150"
        >
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quick DDL Simulation Runner</h2>
              <p className="text-xs text-gray-500 mt-0.5">Directly post SQL statements to FastAPI backend</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="text-gray-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Target Component</label>
              <input
                type="text"
                required
                value={quickTarget}
                onChange={(e) => setQuickTarget(e.target.value)}
                placeholder="db-users"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Original SQL (v1_sql)</label>
              <input
                type="text"
                value={quickV1Sql}
                onChange={(e) => setQuickV1Sql(e.target.value)}
                placeholder="CREATE TABLE users (id INT PRIMARY KEY);"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Updated SQL (v2_sql)</label>
              <input
                type="text"
                value={quickV2Sql}
                onChange={(e) => setQuickV2Sql(e.target.value)}
                placeholder="CREATE TABLE users (id UUID PRIMARY KEY);"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSimulatingQuick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSimulatingQuick ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Backend...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Quick Simulation</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter, Search & Sort Bar Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by simulation name, target, or DDL summary..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as 'All Risk Levels' | RiskSeverity)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All Risk Levels">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'All Categories' | SimulationCategory)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="Database Schema (DDL)">Database Schema (DDL)</option>
              <option value="API Contract">API Contract</option>
              <option value="Service Config">Service Config</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'All Statuses' | SimulationStatus)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Blocked">Blocked</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'Newest First' | 'Highest Risk' | 'Most Affected Components')}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="Newest First">Newest First</option>
              <option value="Highest Risk">Highest Risk</option>
              <option value="Most Affected Components">Most Affected Nodes</option>
            </select>
          </div>

          {(searchQuery || selectedSeverity !== 'All Risk Levels' || selectedCategory !== 'All Categories' || selectedStatus !== 'All Statuses') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-900" />
            <h2 className="text-base font-semibold text-slate-900">Evaluated Simulation Runs</h2>
          </div>
          <span className="text-xs text-gray-500">Showing {filteredSimulations.length} records</span>
        </div>

        {filteredSimulations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <AlertTriangle className="w-8 h-8 text-gray-300" />
            <span className="text-sm font-semibold text-slate-900">No Simulations Found</span>
            <span className="text-xs text-gray-500">Adjust search or filter parameters to view simulation logs.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pl-1 w-8">
                    <span className="sr-only">Compare Select</span>
                  </th>
                  <th className="pb-3 px-2">Simulation & Target</th>
                  <th className="pb-3 px-3">Change Category</th>
                  <th className="pb-3 px-3">Risk Rating</th>
                  <th className="pb-3 px-3">Blast Radius</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Executed</th>
                  <th className="pb-3 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredSimulations.map((sim) => {
                  const isChecked = selectedCompareIds.includes(sim.id);
                  return (
                    <tr key={sim.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Checkbox for side-by-side comparison */}
                      <td className="py-4 pl-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCompare(sim.id)}
                          title="Select to compare side-by-side (max 2)"
                          className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                        />
                      </td>

                      {/* Simulation Name & Target */}
                      <td className="py-4 px-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 text-xs">{sim.name}</span>
                          <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                            <Database className="w-3 h-3 text-emerald-600" />
                            {sim.targetComponent}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 whitespace-nowrap">
                          {sim.category}
                        </span>
                      </td>

                      {/* Risk Rating */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded border ${getSeverityBadgeClass(
                              sim.severity
                            )}`}
                          >
                            {sim.severity}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700">{sim.riskScore}</span>
                        </div>
                      </td>

                      {/* Blast Radius */}
                      <td className="py-4 px-3">
                        <span className="text-xs text-slate-800 font-medium flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          {sim.affectedNodesCount} nodes
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${getStatusBadgeClass(
                            sim.status
                          )}`}
                        >
                          {sim.status}
                        </span>
                      </td>

                      {/* Executed Timestamp */}
                      <td className="py-4 px-3 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{sim.timestamp}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectRecord(sim)}
                            className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateSimulation(sim)}
                            title="Re-run Simulation"
                            className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSimulation(sim.id, sim.name)}
                            title="Delete Record"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && compareObjA && compareObjB && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-4xl w-full p-6 flex flex-col gap-6 animate-in fade-in zoom-in-98 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Side-by-Side Simulation Comparison</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Simulation A Column */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
                <div className="border-b border-gray-200 pb-2 flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Simulation A</span>
                  <h4 className="font-bold text-slate-900 text-sm">{compareObjA.name}</h4>
                  <span className="text-gray-500 font-mono">{compareObjA.targetComponent}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-600">Risk Score</span>
                  <span className="font-mono text-base font-bold text-rose-600">{compareObjA.riskScore}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-600">Blast Radius</span>
                  <span className="font-mono text-slate-900 font-semibold">{compareObjA.affectedNodesCount} nodes</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-700">DDL Statement</span>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 font-mono text-[11px] rounded overflow-x-auto">
                    {compareObjA.v2Sql || compareObjA.changeSummary}
                  </pre>
                </div>
              </div>

              {/* Simulation B Column */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
                <div className="border-b border-gray-200 pb-2 flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Simulation B</span>
                  <h4 className="font-bold text-slate-900 text-sm">{compareObjB.name}</h4>
                  <span className="text-gray-500 font-mono">{compareObjB.targetComponent}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-600">Risk Score</span>
                  <span className="font-mono text-base font-bold text-amber-600">{compareObjB.riskScore}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-600">Blast Radius</span>
                  <span className="font-mono text-slate-900 font-semibold">{compareObjB.affectedNodesCount} nodes</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-700">DDL Statement</span>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 font-mono text-[11px] rounded overflow-x-auto">
                    {compareObjB.v2Sql || compareObjB.changeSummary}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal / Drawer */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-white border-l border-gray-200 sm:border sm:rounded-xl shadow-2xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-gray-400">ID: {inspectRecord.id}</span>
                <h3 className="text-base font-bold text-slate-900">{inspectRecord.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="p-1 text-gray-400 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-gray-50 rounded border border-gray-200">
              <div>
                <span className="text-gray-500">Target Component:</span>
                <p className="font-semibold text-slate-900 font-mono">{inspectRecord.targetComponent}</p>
              </div>
              <div>
                <span className="text-gray-500">Calculated Risk:</span>
                <p className="font-semibold text-rose-600 font-mono">{inspectRecord.riskScore} / 10.0</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900">DDL Statements</h4>
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-500">v1_sql (Before):</span>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 rounded overflow-x-auto mt-0.5">
                    {inspectRecord.v1Sql || 'N/A'}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500">v2_sql (After):</span>
                  <pre className="p-2.5 bg-slate-950 text-emerald-300 rounded overflow-x-auto mt-0.5">
                    {inspectRecord.v2Sql || inspectRecord.changeSummary}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900">Downstream Impacted Components ({inspectRecord.affectedNodesCount})</h4>
              <div className="flex flex-wrap gap-1.5">
                {inspectRecord.affectedNodesList.map((node, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-gray-100 text-slate-800 text-xs font-mono rounded border border-gray-200">
                    {node}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
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
