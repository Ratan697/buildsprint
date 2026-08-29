'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Loader2,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Database,
  History,
  Plus,
} from 'lucide-react';

import {
  fetchSimulationHistory,
  simulateSchemaImpact,
  SimulationRunSummary,
} from '@/lib/api';

export default function SimulationsPage() {
  const [history, setHistory] = useState<SimulationRunSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningSim, setRunningSim] = useState<boolean>(false);
  const [showQuickForm, setShowQuickForm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick simulation state
  const [simName, setSimName] = useState<string>('');
  const [targetComponent, setTargetComponent] = useState<string>('db-users');
  const [v1Sql, setV1Sql] = useState<string>(
    'CREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(255),\n  status INT\n);'
  );
  const [v2Sql, setV2Sql] = useState<string>(
    'CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255),\n  status VARCHAR(50)\n);'
  );

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchSimulationHistory();
    if (res.data) {
      setHistory(res.data);
    } else {
      setErrorMsg(res.error || 'Failed to connect to ChangeShield backend server.');
    }
    setLoading(false);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComponent.trim()) {
      setErrorMsg('Target component ID is required.');
      return;
    }
    if (!v1Sql.trim() || !v2Sql.trim()) {
      setErrorMsg('Both V1 and V2 SQL schema strings are required.');
      return;
    }

    setRunningSim(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      name: simName.trim() || `Schema Change - ${targetComponent}`,
      target_component: targetComponent.trim(),
      v1_sql: v1Sql,
      v2_sql: v2Sql,
      dialect: 'postgres',
    };

    const res = await simulateSchemaImpact(payload);

    if (res.data) {
      const score = res.data.risk_score ?? res.data.blast_radius_analysis?.risk_score ?? 'N/A';
      const title = res.data.name || simName;
      setSuccessMsg(`Simulation "${title}" completed successfully! Risk Score: ${score}`);
      await loadHistory();
    } else {
      setErrorMsg(res.error || 'Failed to execute simulation run.');
    }
    setRunningSim(false);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const formatTimestamp = (isoStr: string | null | undefined) => {
    if (!isoStr) return 'N/A';
    const normalizedStr = isoStr.endsWith('Z') || isoStr.includes('+') ? isoStr : `${isoStr}Z`;
    const d = new Date(normalizedStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Simulation History & Runs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Execute schema change simulations and inspect historical blast radius evaluations from the SQLite database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/simulations/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Interactive Workspace</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowQuickForm(!showQuickForm)}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {showQuickForm ? 'Hide Quick Runner' : 'Quick Runner'}
          </button>
        </div>
      </div>

      {/* Quick Run Form (Toggleable) */}
      {showQuickForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
            <Play className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-semibold text-slate-900">
              Run Quick Schema Impact Simulation
            </h2>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Simulation Name
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="e.g. User ID INT to UUID Migration"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Component ID
                </label>
                <input
                  type="text"
                  value={targetComponent}
                  onChange={(e) => setTargetComponent(e.target.value)}
                  placeholder="e.g. db-users"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  V1 Schema (Before)
                </label>
                <textarea
                  value={v1Sql}
                  onChange={(e) => setV1Sql(e.target.value)}
                  rows={5}
                  className="w-full font-mono text-xs bg-white border border-gray-300 rounded-md p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  V2 Schema (After)
                </label>
                <textarea
                  value={v2Sql}
                  onChange={(e) => setV2Sql(e.target.value)}
                  rows={5}
                  className="w-full font-mono text-xs bg-white border border-gray-300 rounded-md p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center space-x-2 text-rose-700 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={runningSim}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-xs disabled:opacity-50 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                {runningSim ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Blast Radius...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Simulate Blast Radius</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Simulation Runs Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-sm text-slate-900">
              Recorded Simulation Runs ({history.length})
            </h2>
          </div>
          <button
            onClick={loadHistory}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            <p className="text-xs">Loading simulation history from SQLite database...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-center text-gray-400">
            <Inbox className="w-10 h-10 stroke-1" />
            <p className="text-sm font-semibold text-slate-900">
              No simulation runs found
            </p>
            <p className="text-xs text-gray-500">
              Run a simulation above or in the Interactive Workspace to record evaluations in SQLite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Simulation Name</th>
                  <th className="px-4 py-3">Target Component</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3 text-right">Execution Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {sim.name}
                    </td>
                    <td className="px-4 py-3 flex items-center space-x-1.5 font-mono text-slate-700">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      <span>{sim.target_component}</span>
                    </td>
                    <td className="px-4 py-3">{sim.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getRiskBadgeColor(
                          sim.risk_level
                        )}`}
                      >
                        {sim.risk_level} Risk
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {sim.risk_score}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 font-mono">
                      {formatTimestamp(sim.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
