'use client';

import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  Ban,
  Activity,
  Search,
  Filter,
  Calendar,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  UserCheck,
  Building2,
} from 'lucide-react';

export type RiskSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type GovernanceStatus = 'Approved' | 'Blocked' | 'Review Required';
export type DateHorizon = 'Last 7 Days' | 'Last 30 Days' | 'Quarter to Date' | 'All Time';

export interface AuditRecord {
  id: string;
  timestamp: string;
  systemName: string;
  environment: 'Production' | 'Staging';
  changeType: string;
  ddlSummary: string;
  riskScore: number;
  severity: RiskSeverity;
  blastRadiusNodes: number;
  governanceStatus: GovernanceStatus;
  author: string;
  reviewer: string;
  sqlDiff: {
    before: string;
    after: string;
  };
  policyViolations: string[];
  impactedServices: string[];
}

const MOCK_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: 'AUD-2026-8801',
    timestamp: '2026-08-28 14:32 UTC',
    systemName: 'Users & Auth Core',
    environment: 'Production',
    changeType: 'modify_column_type',
    ddlSummary: 'ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;',
    riskScore: 8.6,
    severity: 'Critical',
    blastRadiusNodes: 5,
    governanceStatus: 'Blocked',
    author: 'alex.chen@changeshield.io',
    reviewer: 'sarah.jenkins@changeshield.io',
    sqlDiff: {
      before: 'CREATE TABLE users (\n  customer_id INT PRIMARY KEY,\n  email VARCHAR(255)\n);',
      after: 'CREATE TABLE users (\n  customer_id UUID PRIMARY KEY,\n  email VARCHAR(255)\n);',
    },
    policyViolations: [
      'Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB',
      'Detect High Blast Radius Traversal (>3 Hops)',
    ],
    impactedServices: ['auth-service', 'user-service', 'order-service', 'checkout-api', 'analytics-pipeline'],
  },
  {
    id: 'AUD-2026-8794',
    timestamp: '2026-08-27 09:15 UTC',
    systemName: 'Payment Gateway Core',
    environment: 'Production',
    changeType: 'add_column_with_default',
    ddlSummary: 'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);',
    riskScore: 3.2,
    severity: 'Medium',
    blastRadiusNodes: 2,
    governanceStatus: 'Approved',
    author: 'david.kumar@changeshield.io',
    reviewer: 'security-automated-bot',
    sqlDiff: {
      before: 'CREATE TABLE payments (\n  id UUID PRIMARY KEY,\n  amount DECIMAL(10, 2)\n);',
      after: 'CREATE TABLE payments (\n  id UUID PRIMARY KEY,\n  amount DECIMAL(10, 2),\n  idempotency_key VARCHAR(64)\n);',
    },
    policyViolations: [],
    impactedServices: ['payment-service', 'stripe-webhook-gateway'],
  },
  {
    id: 'AUD-2026-8781',
    timestamp: '2026-08-26 18:45 UTC',
    systemName: 'Order Processing Engine',
    environment: 'Staging',
    changeType: 'drop_foreign_key',
    ddlSummary: 'ALTER TABLE order_items DROP CONSTRAINT fk_orders_user;',
    riskScore: 6.8,
    severity: 'High',
    blastRadiusNodes: 4,
    governanceStatus: 'Review Required',
    author: 'maria.gonzalez@changeshield.io',
    reviewer: 'pending_review',
    sqlDiff: {
      before: 'ALTER TABLE order_items ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);',
      after: '-- CONSTRAINT DROPPED',
    },
    policyViolations: ['Warn on Breaking Foreign Key Alterations'],
    impactedServices: ['order-service', 'inventory-service', 'notification-service', 'db-orders'],
  },
  {
    id: 'AUD-2026-8762',
    timestamp: '2026-08-25 11:04 UTC',
    systemName: 'Catalog Microservice',
    environment: 'Production',
    changeType: 'create_index',
    ddlSummary: 'CREATE INDEX idx_products_category ON products(category_id);',
    riskScore: 1.4,
    severity: 'Low',
    blastRadiusNodes: 1,
    governanceStatus: 'Approved',
    author: 'sam.wilson@changeshield.io',
    reviewer: 'alex.chen@changeshield.io',
    sqlDiff: {
      before: '-- No index on category_id',
      after: 'CREATE INDEX idx_products_category ON products(category_id);',
    },
    policyViolations: [],
    impactedServices: ['catalog-service'],
  },
  {
    id: 'AUD-2026-8740',
    timestamp: '2026-08-24 16:20 UTC',
    systemName: 'Analytics Warehouse',
    environment: 'Staging',
    changeType: 'drop_table',
    ddlSummary: 'DROP TABLE legacy_user_events_2024;',
    riskScore: 9.1,
    severity: 'Critical',
    blastRadiusNodes: 6,
    governanceStatus: 'Blocked',
    author: 'jordan.lee@changeshield.io',
    reviewer: 'policy-enforcer',
    sqlDiff: {
      before: 'CREATE TABLE legacy_user_events_2024 (...);',
      after: 'DROP TABLE legacy_user_events_2024;',
    },
    policyViolations: [
      'Prohibit Table Truncation / Drop in Staging & Prod',
      'Require Multi-Review for Criticality > 4.0',
    ],
    impactedServices: ['bi-dashboard', 'etl-exporter', 'user-behavior-service', 'data-lake-sync', 'warehouse-loader', 'reporting-api'],
  },
  {
    id: 'AUD-2026-8719',
    timestamp: '2026-08-22 08:50 UTC',
    systemName: 'Notification Service',
    environment: 'Production',
    changeType: 'rename_column',
    ddlSummary: 'ALTER TABLE notifications RENAME COLUMN target_email TO recipient_email;',
    riskScore: 5.4,
    severity: 'Medium',
    blastRadiusNodes: 3,
    governanceStatus: 'Approved',
    author: 'elena.rostova@changeshield.io',
    reviewer: 'sarah.jenkins@changeshield.io',
    sqlDiff: {
      before: 'ALTER TABLE notifications ADD COLUMN target_email VARCHAR(255);',
      after: 'ALTER TABLE notifications RENAME COLUMN target_email TO recipient_email;',
    },
    policyViolations: [],
    impactedServices: ['notification-service', 'user-service', 'marketing-automation'],
  },
];

export default function ReportsPage() {
  const [records] = useState<AuditRecord[]>(MOCK_AUDIT_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'All Risk Levels' | RiskSeverity>('All Risk Levels');
  const [selectedStatus, setSelectedStatus] = useState<'All Statuses' | GovernanceStatus>('All Statuses');
  const [selectedHorizon, setSelectedHorizon] = useState<DateHorizon>('Last 30 Days');

  // Selected Record for Inspector Drawer
  const [inspectRecord, setInspectRecord] = useState<AuditRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesSearch =
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.systemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.ddlSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === 'All Risk Levels' || rec.severity === selectedSeverity;

      const matchesStatus =
        selectedStatus === 'All Statuses' || rec.governanceStatus === selectedStatus;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [records, searchQuery, selectedSeverity, selectedStatus]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'System Name', 'Environment', 'Change Type', 'Risk Score', 'Severity', 'Blast Radius Nodes', 'Status', 'Author'];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          r.id,
          `"${r.timestamp}"`,
          `"${r.systemName}"`,
          r.environment,
          r.changeType,
          r.riskScore,
          r.severity,
          r.blastRadiusNodes,
          r.governanceStatus,
          `"${r.author}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChangeShield_Compliance_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported audit trails to CSV successfully.');
  };

  // Export JSON Handler
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChangeShield_Compliance_Audit_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Exported formatted audit logs to JSON successfully.');
  };

  // Print Summary Handler
  const handlePrint = () => {
    triggerToast('Preparing print summary document...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('All Risk Levels');
    setSelectedStatus('All Statuses');
    setSelectedHorizon('Last 30 Days');
  };

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
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: GovernanceStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Review Required':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex flex-col gap-8 print:p-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 print:border-none">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-slate-900" />
            Executive Compliance & Risk Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Schema audit trails, governance compliance scores, and architectural risk summaries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Overall Compliance Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">98.4%</span>
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +1.2% this Q
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Migrations Audited</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">142</span>
            <span className="text-xs text-gray-500">Across 12 services</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">High-Risk Changes Blocked</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">12</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
              Prevented Outages
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Avg. Blast Radius Impact</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">2.4</span>
            <span className="text-xs text-gray-500">Nodes / Migration</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs print:hidden">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Audit ID, System Name, DDL statement, or Author..."
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

        {/* Filters */}
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'All Statuses' | GovernanceStatus)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Blocked">Blocked</option>
              <option value="Review Required">Review Required</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value as DateHorizon)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Quarter to Date">Quarter to Date</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {(searchQuery || selectedSeverity !== 'All Risk Levels' || selectedStatus !== 'All Statuses' || selectedHorizon !== 'Last 30 Days') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-slate-900 underline underline-offset-2 ml-1 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Trail Log Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-900" />
            <h2 className="text-base font-semibold text-slate-900">Schema Change Audit Log</h2>
          </div>
          <span className="text-xs text-gray-500">Showing {filteredRecords.length} records</span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <AlertTriangle className="w-8 h-8 text-gray-300" />
            <span className="text-sm font-semibold text-slate-900">No Matching Audit Logs</span>
            <span className="text-xs text-gray-500">
              No schema change records matched your search query or filter criteria.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pl-1">Audit ID & Timestamp</th>
                  <th className="pb-3 px-3">System / Environment</th>
                  <th className="pb-3 px-3">Change Summary</th>
                  <th className="pb-3 px-3">Risk & Severity</th>
                  <th className="pb-3 px-3">Blast Radius</th>
                  <th className="pb-3 px-3">Governance Status</th>
                  <th className="pb-3 pr-1 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* ID & Timestamp */}
                    <td className="py-4 pl-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-semibold text-slate-900">{rec.id}</span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {rec.timestamp}
                        </span>
                      </div>
                    </td>

                    {/* System & Environment */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900 text-xs">{rec.systemName}</span>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border w-fit ${
                            rec.environment === 'Production'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {rec.environment}
                        </span>
                      </div>
                    </td>

                    {/* Change DDL Summary */}
                    <td className="py-4 px-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-slate-800 truncate bg-gray-50 px-2 py-1 rounded border border-gray-200/80">
                          {rec.ddlSummary}
                        </span>
                        <span className="text-[11px] text-gray-400 capitalize">Type: {rec.changeType}</span>
                      </div>
                    </td>

                    {/* Risk Score & Severity */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded border ${getSeverityBadgeClass(
                            rec.severity
                          )}`}
                        >
                          {rec.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">{rec.riskScore}</span>
                      </div>
                    </td>

                    {/* Blast Radius */}
                    <td className="py-4 px-3">
                      <span className="text-xs text-slate-800 font-medium">
                        {rec.blastRadiusNodes} downstream node{rec.blastRadiusNodes !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Governance Status */}
                    <td className="py-4 px-3">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded border ${getStatusBadgeClass(
                          rec.governanceStatus
                        )}`}
                      >
                        {rec.governanceStatus}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 pr-1 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => setInspectRecord(rec)}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Inspector Modal / Drawer */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
          <div className="bg-white border-l border-gray-200 sm:border sm:rounded-xl shadow-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-mono text-gray-400">Audit Reference: {inspectRecord.id}</span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  Audit Inspection Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200/80 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 font-medium">Target System</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {inspectRecord.systemName}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 font-medium">Environment</span>
                <span className="font-semibold text-slate-900">{inspectRecord.environment}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 font-medium">Author</span>
                <span className="font-semibold text-slate-900 truncate">{inspectRecord.author}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 font-medium">Reviewer</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                  {inspectRecord.reviewer}
                </span>
              </div>
            </div>

            {/* SQL / DDL Change Diff Preview */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                DDL Migration Statements
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-500">Before (v1)</span>
                  <pre className="p-3 bg-slate-950 text-slate-200 text-xs font-mono rounded-md overflow-x-auto border border-slate-800">
                    {inspectRecord.sqlDiff.before}
                  </pre>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-500">After (v2)</span>
                  <pre className="p-3 bg-slate-950 text-emerald-300 text-xs font-mono rounded-md overflow-x-auto border border-slate-800">
                    {inspectRecord.sqlDiff.after}
                  </pre>
                </div>
              </div>
            </div>

            {/* Triggered Policy Violations */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Triggered Risk Rules & Policy Violations
              </h4>

              {inspectRecord.policyViolations.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No guardrail policy violations detected for this change.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {inspectRecord.policyViolations.map((viol, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2 font-medium"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{viol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Impacted Downstream Microservices */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Impacted Downstream Components ({inspectRecord.impactedServices.length})
              </h4>

              <div className="flex flex-wrap gap-1.5">
                {inspectRecord.impactedServices.map((srv, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-gray-100 text-slate-800 text-xs font-mono rounded border border-gray-200"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
