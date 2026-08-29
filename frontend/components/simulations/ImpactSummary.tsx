'use client';

import React from 'react';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import { ShieldAlert, AlertTriangle, FileText, Wrench, Activity, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

export default function ImpactSummary() {
  const { analysisResult, activeTab, setActiveTab, simulationInput, resetSimulation } = useChangeShieldStore();

  if (!analysisResult) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
        Click <strong className="text-slate-900">&quot;Simulate Change&quot;</strong> above to query FastAPI and calculate blast radius metrics.
      </div>
    );
  }

  const blastReport = analysisResult.blast_radius_analysis;
  const riskScore = blastReport?.risk_score ?? 0;
  const impactedCount = blastReport?.impacted_count ?? 0;
  const startNode = blastReport?.start_node ?? 'N/A';

  const nodeDetails = blastReport?.node_details || {};
  let apisAffected = 0;
  let dbsAffected = 0;
  let servicesAffected = 0;

  Object.values(nodeDetails).forEach((item) => {
    const type = String(item.attributes?.type || '').toLowerCase();
    if (type.includes('db') || type.includes('database')) {
      dbsAffected += 1;
    } else if (type.includes('gateway') || type.includes('api')) {
      apisAffected += 1;
    } else {
      servicesAffected += 1;
    }
  });

  const getRiskLevelBadge = (score: number) => {
    if (score >= 8.0) return { label: 'CRITICAL', color: 'text-red-700 bg-red-50 border-red-200' };
    if (score >= 5.0) return { label: 'HIGH', color: 'text-red-700 bg-red-50 border-red-200' };
    if (score >= 3.0) return { label: 'MEDIUM', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'LOW', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const riskBadge = getRiskLevelBadge(riskScore);
  const completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-xs">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-700 rounded-md border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Blast Radius & Impact Report</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Simulation Complete
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              <span>Source Target: <code className="font-mono text-slate-800">{startNode}</code></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {completionTime}</span>
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Evidence</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remediation')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'remediation'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Remediation</span>
            </button>
          </div>

          <button
            type="button"
            onClick={resetSimulation}
            title="Start New Simulation"
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg flex flex-col">
          <span className="text-xs font-medium text-red-700">Calculated Risk Score</span>
          <span className="text-2xl font-bold text-red-700 mt-1">{riskScore}</span>
        </div>

        <div className={`p-3 border rounded-lg flex flex-col ${riskBadge.color}`}>
          <span className="text-xs font-medium">Risk Level</span>
          <span className="text-lg font-bold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {riskBadge.label}
          </span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col">
          <span className="text-xs font-medium text-gray-500 font-sans">Downstream Affected</span>
          <span className="text-2xl font-semibold text-slate-900 mt-1">{impactedCount}</span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col">
          <span className="text-xs font-medium text-gray-500 font-sans">Backend Services</span>
          <span className="text-2xl font-semibold text-slate-900 mt-1">{servicesAffected}</span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col">
          <span className="text-xs font-medium text-gray-500 font-sans">API Gateways</span>
          <span className="text-2xl font-semibold text-slate-900 mt-1">{apisAffected}</span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col">
          <span className="text-xs font-medium text-gray-500 font-sans">Databases</span>
          <span className="text-2xl font-semibold text-slate-900 mt-1">{dbsAffected}</span>
        </div>
      </div>

      {/* Target Change Summary metadata */}
      {simulationInput && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 flex items-center justify-between">
          <span>
            Target change simulated on <code className="font-mono font-semibold text-slate-900">{simulationInput.target_component}</code>
          </span>
          <span className="font-mono text-[11px] text-gray-500">
            {simulationInput.v1_sql ? 'Custom SQL Compare Mode' : 'Default Service Mode'}
          </span>
        </div>
      )}
    </div>
  );
}
