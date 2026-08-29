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
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  Clock,
  Share2,
  Copy,
  Sparkles,
  Database,
  GitBranch,
  ArrowRight,
  Check,
  Building2,
  UserCheck,
} from 'lucide-react';

export type RiskSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type GovernanceStatus = 'Approved' | 'Blocked' | 'Review Required';

export interface AuditReport {
  id: string;
  systemName: string;
  targetComponent: string;
  environment: 'Production' | 'Staging';
  commitSha: string;
  branch: string;
  author: string;
  reviewer: string;
  timestamp: string;
  changeSummary: string;
  v1Sql: string;
  v2Sql: string;
  riskScore: number;
  severity: RiskSeverity;
  status: GovernanceStatus;
  affectedNodesCount: number;
  impactedServices: { name: string; type: string; criticality: number; consumers: number }[];
  evidencePaths: string[][];
  policyViolations: string[];
  remediationSteps: { title: string; action: string; description: string }[];
  testRecommendations: string[];
}

const MOCK_AUDIT_REPORTS: AuditReport[] = [
  {
    id: 'RPT-2026-8801',
    systemName: 'E-Commerce Core Platform',
    targetComponent: 'db-users / users.customer_id',
    environment: 'Production',
    commitSha: '9b8c2f1',
    branch: 'main',
    author: 'alex.chen@changeshield.io',
    reviewer: 'sarah.jenkins@changeshield.io',
    timestamp: '2026-08-28 14:32 UTC',
    changeSummary: 'ALTER TABLE users ALTER COLUMN customer_id TYPE UUID;',
    v1Sql: 'CREATE TABLE users (customer_id INT PRIMARY KEY, email VARCHAR(255));',
    v2Sql: 'CREATE TABLE users (customer_id UUID PRIMARY KEY, email VARCHAR(255));',
    riskScore: 8.6,
    severity: 'Critical',
    status: 'Blocked',
    affectedNodesCount: 5,
    impactedServices: [
      { name: 'user-service', type: 'Backend', criticality: 4.8, consumers: 4 },
      { name: 'auth-service', type: 'Backend', criticality: 5.0, consumers: 6 },
      { name: 'order-service', type: 'Backend', criticality: 4.2, consumers: 3 },
      { name: 'checkout-api', type: 'API Gateway', criticality: 4.0, consumers: 8 },
      { name: 'analytics-pipeline', type: 'Worker', criticality: 3.0, consumers: 2 },
    ],
    evidencePaths: [
      ['db-users', 'user-service', 'auth-service', 'checkout-api'],
      ['db-users', 'user-service', 'order-service', 'checkout-api'],
      ['db-users', 'user-service', 'analytics-pipeline'],
    ],
    policyViolations: [
      'Block Dropped Columns / Incompatible Type Alterations on Tier-1 DB',
      'Detect High Blast Radius Traversal (>3 Hops)',
    ],
    remediationSteps: [
      {
        title: 'Apply Dual-Write Expand/Contract Schema Shim',
        action: 'Deploy Compatibility Migration',
        description: 'Add customer_id_uuid alongside customer_id without altering original column type.',
      },
      {
        title: 'Update Downstream ORM Models',
        action: 'Sync Microservice Models',
        description: 'Update user-service and order-service query adapters to accept stringified UUIDs.',
      },
      {
        title: 'API Gateway Deprecation Header',
        action: 'Deploy Gateway Facade',
        description: 'Inject Sunset HTTP headers on legacy INT endpoints prior to cutover.',
      },
    ],
    testRecommendations: [
      'Run end-to-end integration test suite across order-service and auth-service.',
      'Execute staging dual-write canary regression test.',
      'Verify API gateway contract validations for UUID request payload headers.',
    ],
  },
  {
    id: 'RPT-2026-8794',
    systemName: 'Payment & Settlement Gateway',
    targetComponent: 'payment-service / payments.idempotency_key',
    environment: 'Production',
    commitSha: '4a1e9c8',
    branch: 'main',
    author: 'david.kumar@changeshield.io',
    reviewer: 'security-automated-bot',
    timestamp: '2026-08-27 09:15 UTC',
    changeSummary: 'ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(64);',
    v1Sql: 'CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2));',
    v2Sql: 'CREATE TABLE payments (id UUID PRIMARY KEY, amount DECIMAL(10,2), idempotency_key VARCHAR(64));',
    riskScore: 3.2,
    severity: 'Medium',
    status: 'Approved',
    affectedNodesCount: 2,
    impactedServices: [
      { name: 'payment-service', type: 'Backend', criticality: 5.0, consumers: 5 },
      { name: 'stripe-webhook-gateway', type: 'External API', criticality: 4.0, consumers: 2 },
    ],
    evidencePaths: [['payment-service', 'stripe-webhook-gateway']],
    policyViolations: [],
    remediationSteps: [
      {
        title: 'Non-Null Constraint Verification',
        action: 'Apply Default Constraint',
        description: 'Ensure new idempotency_key column allows NULL during rolling deployment.',
      },
    ],
    testRecommendations: ['Execute payment API idempotency unit test suite.'],
  },
  {
    id: 'RPT-2026-8781',
    systemName: 'Order Processing Engine',
    targetComponent: 'order-service / fk_orders_user',
    environment: 'Staging',
    commitSha: '2d7f8a1',
    branch: 'main',
    author: 'maria.gonzalez@changeshield.io',
    reviewer: 'pending_review',
    timestamp: '2026-08-26 18:45 UTC',
    changeSummary: 'ALTER TABLE order_items DROP CONSTRAINT fk_orders_user;',
    v1Sql: 'ALTER TABLE order_items ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);',
    v2Sql: '-- Foreign key constraint dropped',
    riskScore: 6.8,
    severity: 'High',
    status: 'Review Required',
    affectedNodesCount: 4,
    impactedServices: [
      { name: 'order-service', type: 'Backend', criticality: 4.2, consumers: 3 },
      { name: 'inventory-service', type: 'Backend', criticality: 3.8, consumers: 2 },
      { name: 'notification-service', type: 'Worker', criticality: 3.5, consumers: 1 },
      { name: 'db-orders', type: 'Database', criticality: 5.0, consumers: 2 },
    ],
    evidencePaths: [
      ['db-orders', 'order-service', 'inventory-service'],
      ['db-orders', 'order-service', 'notification-service'],
    ],
    policyViolations: ['Warn on Breaking Foreign Key Alterations'],
    remediationSteps: [
      {
        title: 'Verify Application-Level Foreign Key Checks',
        action: 'Add Validation Logic',
        description: 'Ensure ORM enforces user relational integrity before dropping foreign key constraint.',
      },
    ],
    testRecommendations: ['Run staging orphan record data integrity scan.'],
  },
  {
    id: 'RPT-2026-8762',
    systemName: 'Catalog Microservice',
    targetComponent: 'catalog-service / idx_products_category',
    environment: 'Production',
    commitSha: 'f8101a2',
    branch: 'main',
    author: 'sam.wilson@changeshield.io',
    reviewer: 'alex.chen@changeshield.io',
    timestamp: '2026-08-25 11:04 UTC',
    changeSummary: 'CREATE INDEX idx_products_category ON products(category_id);',
    v1Sql: '-- No index',
    v2Sql: 'CREATE INDEX idx_products_category ON products(category_id);',
    riskScore: 1.4,
    severity: 'Low',
    status: 'Approved',
    affectedNodesCount: 1,
    impactedServices: [{ name: 'catalog-service', type: 'Backend', criticality: 3.8, consumers: 4 }],
    evidencePaths: [['catalog-service']],
    policyViolations: [],
    remediationSteps: [
      {
        title: 'Concurrent Index Build',
        action: 'Use CONCURRENTLY keyword',
        description: 'Build index concurrently to prevent table lock during high traffic.',
      },
    ],
    testRecommendations: ['Verify query explain plan for category_id filter.'],
  },
];

export default function ReportsPage() {
  const [reports] = useState<AuditReport[]>(MOCK_AUDIT_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'All Severities' | RiskSeverity>('All Severities');
  const [selectedStatus, setSelectedStatus] = useState<'All Statuses' | GovernanceStatus>('All Statuses');

  // Selected Report Dossier Modal
  const [selectedDossier, setSelectedDossier] = useState<AuditReport | null>(null);

  // Copy Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter Logic
  const filteredReports = useMemo(() => {
    return reports.filter((rpt) => {
      const matchesSearch =
        rpt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.systemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.targetComponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.commitSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpt.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === 'All Severities' || rpt.severity === selectedSeverity;

      const matchesStatus =
        selectedStatus === 'All Statuses' || rpt.status === selectedStatus;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [reports, searchQuery, selectedSeverity, selectedStatus]);

  // Handlers
  const handleExportAllJSON = () => {
    const blob = new Blob([JSON.stringify(filteredReports, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChangeShield_Technical_Audit_Reports_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported all audit dossiers to JSON.');
  };

  const handleExportAllCSV = () => {
    const headers = ['Report ID', 'System Name', 'Target Component', 'Commit SHA', 'Risk Score', 'Severity', 'Status', 'Author', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...filteredReports.map((r) =>
        [
          r.id,
          `"${r.systemName}"`,
          `"${r.targetComponent}"`,
          r.commitSha,
          r.riskScore,
          r.severity,
          r.status,
          `"${r.author}"`,
          `"${r.timestamp}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChangeShield_Technical_Audit_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported all audit dossiers to CSV.');
  };

  const handlePrintDossier = () => {
    showToast('Preparing dossier print view...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCopyMarkdownSummary = (report: AuditReport) => {
    const markdown = `
### ChangeShield Technical Audit Dossier: ${report.id}
- **System**: ${report.systemName} (${report.environment})
- **Target**: \`${report.targetComponent}\`
- **Commit**: \`${report.commitSha}\` on \`${report.branch}\` by ${report.author}
- **Risk Score**: ${report.riskScore} / 10.0 (${report.severity.toUpperCase()})
- **Governance Status**: ${report.status.toUpperCase()}
- **Downstream Impact**: ${report.affectedNodesCount} components
- **DDL Change**: \`${report.changeSummary}\`
`;
    navigator.clipboard.writeText(markdown.trim());
    setCopiedSummary(true);
    showToast('Copied Markdown audit summary to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 print:border-none">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-slate-900" />
            Deployment Impact & Audit Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Technical review dossiers answering: What changed? What can break? Why? and What should we do?
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportAllCSV}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllJSON}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Shareable workspace audit link copied to clipboard.')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Generated Reports</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{reports.length} Dossiers</span>
            <span className="text-xs text-gray-500">Audited</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Blocked High-Risk Deployments</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {reports.filter((r) => r.status === 'Blocked').length}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
              Outages Prevented
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Avg. Downstream Impact</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">3.0 Nodes</span>
            <span className="text-xs text-gray-500">Per Change</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Compliance Pass Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">75.0%</span>
            <span className="text-xs text-gray-500">Gated Safely</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by system name, component, commit SHA, or author..."
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

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as 'All Severities' | RiskSeverity)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All Severities">All Severities</option>
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
        </div>
      </div>

      {/* Audit Reports Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Technical Audit Dossiers</h2>
          <span className="text-xs text-gray-500">Showing {filteredReports.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                <th className="pb-3 pl-1">Report ID & System</th>
                <th className="pb-3 px-3">Target & Commit</th>
                <th className="pb-3 px-3">DDL Change Summary</th>
                <th className="pb-3 px-3">Risk Rating</th>
                <th className="pb-3 px-3">Blast Radius</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 pr-1 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredReports.map((rpt) => (
                <tr key={rpt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pl-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold text-slate-900">{rpt.id}</span>
                      <span className="text-xs text-gray-500 font-medium">{rpt.systemName}</span>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono text-slate-800 font-semibold">{rpt.targetComponent}</span>
                      <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> {rpt.commitSha} ({rpt.branch})
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-3 max-w-xs">
                    <span className="text-xs font-mono text-slate-800 truncate bg-gray-50 px-2 py-1 rounded border border-gray-200/80 block">
                      {rpt.changeSummary}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded border ${getSeverityBadgeClass(
                          rpt.severity
                        )}`}
                      >
                        {rpt.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">{rpt.riskScore}</span>
                    </div>
                  </td>

                  <td className="py-4 px-3 text-xs text-slate-800 font-medium">
                    {rpt.affectedNodesCount} nodes
                  </td>

                  <td className="py-4 px-3">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded border ${getStatusBadgeClass(
                        rpt.status
                      )}`}
                    >
                      {rpt.status}
                    </span>
                  </td>

                  <td className="py-4 pr-1 text-right print:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedDossier(rpt)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Technical Report Dossier Modal */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white border-0 sm:border border-gray-200 sm:rounded-xl shadow-2xl max-w-3xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-8 animate-in zoom-in-98 duration-150">
            {/* Dossier Modal Header & Top Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs font-mono text-gray-400">Technical Dossier ID: {selectedDossier.id}</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                  Deployment Impact Dossier
                </h3>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopyMarkdownSummary(selectedDossier)}
                  title="Copy Summary Markdown"
                  className="p-2 text-gray-500 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer border border-gray-200"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span>Print / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="p-1.5 text-gray-400 hover:text-slate-900 rounded-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SECTION 1: WHAT CHANGED? */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">WHAT CHANGED?</h4>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200/80 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">System</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> {selectedDossier.systemName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Environment</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedDossier.environment}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Author</span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5">{selectedDossier.author}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Reviewer</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" /> {selectedDossier.reviewer}
                  </p>
                </div>
              </div>

              {/* DDL Code Diff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-500">v1_sql (Original)</span>
                  <pre className="p-3 bg-slate-950 text-slate-200 font-mono rounded-md overflow-x-auto border border-slate-800 text-[11px]">
                    {selectedDossier.v1Sql}
                  </pre>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-500">v2_sql (Proposed Modification)</span>
                  <pre className="p-3 bg-slate-950 text-emerald-300 font-mono rounded-md overflow-x-auto border border-slate-800 text-[11px]">
                    {selectedDossier.v2Sql}
                  </pre>
                </div>
              </div>
            </div>

            {/* SECTION 2: WHAT CAN BREAK? */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">WHAT CAN BREAK?</h4>
              </div>

              {/* Risk Banner */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <div>
                    <span className="text-xs font-semibold text-rose-900">
                      Calculated Blast Radius Risk Rating: {selectedDossier.riskScore} / 10.0
                    </span>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Severity Rating: {selectedDossier.severity.toUpperCase()} • Enforcement Status: {selectedDossier.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono px-3 py-1 bg-white border border-rose-300 rounded text-rose-700">
                  {selectedDossier.affectedNodesCount} Nodes Impacted
                </span>
              </div>

              {/* Impacted Components List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedDossier.impactedServices.map((srv, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-900 font-mono">{srv.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono">Crit {srv.criticality}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: WHY? (EVIDENCE & DEPENDENCY PATHS) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">WHY? (EVIDENCE & PATH TRACES)</h4>
              </div>

              {/* Path Traversal Traces */}
              <div className="flex flex-col gap-2 text-xs">
                {selectedDossier.evidencePaths.map((path, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded font-mono text-[11px] flex items-center gap-2 overflow-x-auto">
                    <span className="text-gray-400 font-sans text-[10px]">Trace #{idx + 1}:</span>
                    {path.map((node, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-slate-900 font-semibold">
                          {node}
                        </span>
                        {sIdx < path.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>

              {/* Triggered Policy Violations */}
              {selectedDossier.policyViolations.length > 0 && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-slate-900">Triggered Policy Violations</span>
                  {selectedDossier.policyViolations.map((viol, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{viol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 4: WHAT SHOULD WE DO? */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">WHAT SHOULD WE DO? (REMEDIATION)</h4>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                {selectedDossier.remediationSteps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{idx + 1}. {step.title}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 text-slate-700">
                        {step.action}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex flex-col gap-1 text-xs">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Verification Suite
                </span>
                <ul className="list-disc pl-5 text-emerald-800 text-[11px] space-y-1 mt-1">
                  {selectedDossier.testRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Close Report Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
