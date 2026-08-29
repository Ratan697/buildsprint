'use client';

import React, { useState } from 'react';
import { simulateChange, SimulateChangePayload, SimulateChangeResponse } from '../lib/api';
import { Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SimulationResult {
  riskScore?: number;
  affectedNodes?: string[];
  evidenceLogs?: string[];
  rawResponse?: SimulateChangeResponse;
}

interface SimulationPanelProps {
  projectId?: string;
  onSimulationStart?: () => void;
  onSimulationComplete?: (result: SimulationResult) => void;
  onError?: (error: string) => void;
}

export default function SimulationPanel({
  projectId = 'default-project',
  onSimulationStart,
  onSimulationComplete,
  onError,
}: SimulationPanelProps) {
  const [targetComponent, setTargetComponent] = useState('users.customer_id');
  const [changeType, setChangeType] = useState('modify_column_type');
  const [oldValue, setOldValue] = useState('INT');
  const [newValue, setNewValue] = useState('UUID');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (onSimulationStart) {
      onSimulationStart();
    }

    const payload: SimulateChangePayload = {
      project_id: projectId,
      target_component: targetComponent,
      change_type: changeType,
      old_value: oldValue,
      new_value: newValue,
    };

    const res = await simulateChange(payload);

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      if (onError) {
        onError(res.error);
      }
      return;
    }

    const data = res.data;
    
    // Extract risk score, affected nodes, and evidence logs from backend response
    const blastReport = data?.blast_radius_analysis;
    const riskScore = blastReport?.risk_score ?? 0;
    const affectedNodes: string[] = blastReport?.impacted_nodes || [];
    const evidenceLogs: string[] = Object.keys(blastReport?.paths || {}).map(
      (node) => `Impact path to ${node}: ${JSON.stringify(blastReport?.paths[node])}`
    );

    const result: SimulationResult = {
      riskScore,
      affectedNodes,
      evidenceLogs,
      rawResponse: data || undefined,
    };

    setLastResult(result);
    if (onSimulationComplete) {
      onSimulationComplete(result);
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Simulation Control</h2>
          <p className="text-xs text-slate-400 mt-0.5">Test impact of architectural changes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Target Component</label>
          <input
            type="text"
            required
            value={targetComponent}
            onChange={(e) => setTargetComponent(e.target.value)}
            placeholder="e.g. users.customer_id"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Change Type</label>
          <select
            value={changeType}
            onChange={(e) => setChangeType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          >
            <option value="modify_column_type">modify_column_type</option>
            <option value="remove_endpoint">remove_endpoint</option>
            <option value="rename_field">rename_field</option>
            <option value="deprecated_service">deprecated_service</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Old Value</label>
            <input
              type="text"
              value={oldValue}
              onChange={(e) => setOldValue(e.target.value)}
              placeholder="INT"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">New Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="break-all">{errorMsg}</div>
        </div>
      )}

      {lastResult && !errorMsg && (
        <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Simulation Status</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Calculated Risk</span>
            <span
              className={`font-mono text-sm font-bold ${
                (lastResult.riskScore ?? 0) >= 0.7 || (lastResult.riskScore ?? 0) >= 70
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {typeof lastResult.riskScore === 'number'
                ? lastResult.riskScore > 1
                  ? `${lastResult.riskScore}%`
                  : `${Math.round(lastResult.riskScore * 100)}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
