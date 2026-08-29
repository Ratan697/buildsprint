'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  Ban,
  Activity,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  timestamp: string;
  systemName: string;
  changeType: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Approved' | 'Blocked' | 'Review Required';
}

const AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'audit-101',
    timestamp: '2026-08-28 14:32:00',
    systemName: 'Users & Auth Core',
    changeType: 'Column INT -> UUID Migration',
    riskScore: 11.5,
    riskLevel: 'High',
    status: 'Blocked',
  },
  {
    id: 'audit-102',
    timestamp: '2026-08-27 10:15:00',
    systemName: 'Order Processing Platform',
    changeType: 'Added Index on created_at',
    riskScore: 2.1,
    riskLevel: 'Low',
    status: 'Approved',
  },
  {
    id: 'audit-103',
    timestamp: '2026-08-26 16:45:00',
    systemName: 'Payment Gateway Integration',
    changeType: 'Altered Numeric Precision',
    riskScore: 6.8,
    riskLevel: 'Medium',
    status: 'Review Required',
  },
];

export default function ReportsPage() {
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const filteredLogs = AUDIT_LOGS.filter((log) => {
    if (filterRisk === 'all') return true;
    return log.riskLevel.toLowerCase() === filterRisk.toLowerCase();
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(AUDIT_LOGS, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'changeshield-compliance-report.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    const headers = 'Audit ID,Timestamp,System Name,Change Type,Risk Score,Risk Level,Status\n';
    const rows = AUDIT_LOGS.map(
      (l) => `${l.id},${l.timestamp},"${l.systemName}","${l.changeType}",${l.riskScore},${l.riskLevel},${l.status}`
    ).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'changeshield-compliance-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Compliance & Change Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit logs, governance metrics, and architectural risk assessment summary exports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Compliance Score</p>
            <p className="text-2xl font-bold text-slate-900">98.4%</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Changes Audited</p>
            <p className="text-2xl font-bold text-slate-900">142</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">High Risk Blocked</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Avg Blast Radius</p>
            <p className="text-2xl font-bold text-slate-900">2.4 Nodes</p>
          </div>
        </div>
      </div>

      {/* Historical Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-900">
            Compliance Audit Log Trail
          </h2>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Filter Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Audit ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">System Name</th>
                <th className="px-4 py-3">Change Description</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Governance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {log.id}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {log.systemName}
                  </td>
                  <td className="px-4 py-3">{log.changeType}</td>
                  <td className="px-4 py-3 font-bold">{log.riskLevel} ({log.riskScore})</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        log.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'Blocked'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

