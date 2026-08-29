'use client';

import React, { useState } from 'react';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import {
  FileCode,
  Layers,
  Route,
  Info,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Database,
  Server,
  Cpu,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Code,
} from 'lucide-react';

export default function EvidencePanel() {
  const { analysisResult } = useChangeShieldStore();
  const [showRawJson, setShowRawJson] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  if (!analysisResult) return null;

  const blastReport = analysisResult.blast_radius_analysis;
  const paths = blastReport?.paths || {};
  const schemaMods = analysisResult.schema_modifications || {};
  const nodeDetails = blastReport?.node_details || {};
  const startNode = blastReport?.start_node || 'db-users';

  const pathEntries = Object.entries(paths);

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId],
    }));
  };

  // Helper to generate realistic causal failure analysis based on node & schema diff
  const generateCausalFailureFlow = (nodeId: string, depth: number, path: string[]) => {
    const isDirect = depth === 1;
    const prevNode = path.length > 1 ? path[path.length - 2] : startNode;

    let inputExpectation = `Queries '${prevNode}' expecting historical schema contract and data types.`;
    let failureMechanism = `Database schema alterations or type mismatches lead to unhandled runtime serialization errors.`;
    let outputImpact = `Fails to fulfill downstream API requests, propagating HTTP 500 errors to callers.`;

    if (nodeId.toLowerCase().includes('user') || nodeId.toLowerCase().includes('account')) {
      inputExpectation = `Reads table '${startNode}' via ORM models expecting integer primary keys and existing column definitions.`;
      failureMechanism = `Type mismatch (e.g. INT → UUID) causes ORM query mapping to fail; missing/dropped columns throw SQL column not found errors.`;
      outputImpact = `Fails to return UserDTO payload; returns HTTP 500 Internal Server Error to calling services.`;
    } else if (nodeId.toLowerCase().includes('auth') || nodeId.toLowerCase().includes('payment')) {
      inputExpectation = `Calls '${prevNode}' expecting verified User DTO with integer identifier to generate JWT tokens / process transactions.`;
      failureMechanism = `Received 500 error or malformed UUID string payload from '${prevNode}' → JSON schema validation & token signing crashes.`;
      outputImpact = `Rejects customer authentication tokens / transaction requests with 401/502 Bad Gateway.`;
    } else if (nodeId.toLowerCase().includes('gateway') || nodeId.toLowerCase().includes('api')) {
      inputExpectation = `Routes client ingress HTTP requests to downstream microservices ('${prevNode}').`;
      failureMechanism = `Upstream dependent services timeout or return 500/502 errors → circuit breakers trip open.`;
      outputImpact = `Public API endpoints return HTTP 502/503 Service Unavailable to web & mobile frontend clients.`;
    }

    return {
      inputExpectation,
      failureMechanism,
      outputImpact,
      isDirect,
      prevNode,
    };
  };

  // Extract modified columns for display
  const detectedDiffs: Array<{ table: string; column: string; oldType: string; newType: string }> = [];
  if (schemaMods && typeof schemaMods === 'object') {
    Object.entries(schemaMods).forEach(([table, cols]) => {
      if (cols && typeof cols === 'object') {
        Object.entries(cols as Record<string, any>).forEach(([col, val]) => {
          if (val && typeof val === 'object' && 'old_type' in val && 'new_type' in val) {
            detectedDiffs.push({
              table,
              column: col,
              oldType: String(val.old_type),
              newType: String(val.new_type),
            });
          }
        });
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-xs">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Evidence & Causal Propagation Traces</span>
            <span className="text-xs font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-bold">
              {analysisResult.risk_level || 'CRITICAL'} RISK
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Step-by-step trace of how changes in <code className="font-mono font-semibold text-slate-800">{startNode}</code> break inputs & outputs across dependent systems.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}</span>
        </button>
      </div>

      {/* Raw JSON Accordion if toggled */}
      {showRawJson && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-600" />
            Raw AST Analysis Payload
          </span>
          <pre className="p-3 bg-slate-950 text-slate-100 text-xs font-mono rounded-md overflow-x-auto border border-slate-800">
            {JSON.stringify(
              {
                schema_modifications: schemaMods,
                blast_radius_analysis: blastReport,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Section 1: Detected Root Schema Alteration */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Database className="w-4 h-4 text-indigo-600" />
            Root Schema Alteration (Origin: {startNode})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {detectedDiffs.length} breaking contract modifications
          </span>
        </div>

        {detectedDiffs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {detectedDiffs.map((diff, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-md flex flex-col gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Table: <code className="text-indigo-600 font-mono">{diff.table}</code></span>
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px] font-bold">
                    BREAKING
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-900 font-bold mt-1">
                  Column: {diff.column}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                  <span className="text-rose-600 line-through bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                    {diff.oldType}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {diff.newType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-600 font-mono p-2 bg-white rounded border border-slate-200">
            Detected structural modifications on {startNode}. Downstream callers will receive altered response structures.
          </div>
        )}
      </div>

      {/* Section 2: Step-by-Step Causal Data-Flow Impact Chains */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Route className="w-4 h-4 text-amber-600" />
            Causal Input → Output Propagation Chain
          </span>
          <p className="text-xs text-gray-500 mt-0.5">
            How modifying the output of <code className="font-mono">{startNode}</code> cascades and breaks input assumptions across each downstream hop:
          </p>
        </div>

        {pathEntries.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>No downstream component paths were affected by this change target.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pathEntries.map(([targetNode, pathList]) => {
              const detail = nodeDetails[targetNode];
              const criticality = detail?.criticality ?? 1.0;
              const depth = detail?.depth ?? 1;
              const primaryPath = pathList[0] || [startNode, targetNode];
              const isExpanded = expandedNodes[targetNode] !== false; // default expanded

              const { inputExpectation, failureMechanism, outputImpact } = generateCausalFailureFlow(
                targetNode,
                depth,
                primaryPath
              );

              return (
                <div
                  key={targetNode}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all bg-white"
                >
                  {/* Card Header with summary */}
                  <div
                    onClick={() => toggleNodeExpand(targetNode)}
                    className="p-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                        {depth === 1 ? <Cpu className="w-4 h-4 text-blue-600" /> : <Server className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{targetNode}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                            Hop #{depth} Broken
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Trace: {primaryPath.join(' → ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">
                        Depth: {depth}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold">
                        Criticality: {criticality.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Causal Chain Body */}
                  {isExpanded && (
                    <div className="p-5 flex flex-col gap-4">
                      {/* Step 1: Input Received */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                            1
                          </span>
                          <div className="w-0.5 h-12 bg-slate-200 my-1" />
                        </div>
                        <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <span>📥 Upstream Input Contract Received</span>
                          </div>
                          <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                            {inputExpectation}
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Internal Transformation Failure */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                            2
                          </span>
                          <div className="w-0.5 h-12 bg-slate-200 my-1" />
                        </div>
                        <div className="flex-1 bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                          <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>💥 Code & File Failure Mechanism</span>
                          </div>
                          <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                            {failureMechanism}
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Cascading Output Generated */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                            3
                          </span>
                        </div>
                        <div className="flex-1 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span>📤 Resulting Bad Output to Downstream Callers</span>
                          </div>
                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            {outputImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
