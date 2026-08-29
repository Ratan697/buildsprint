'use client';

import React from 'react';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import { FileCode, Layers, Route, Info } from 'lucide-react';

export default function EvidencePanel() {
  const { analysisResult } = useChangeShieldStore();

  if (!analysisResult) return null;

  const blastReport = analysisResult.blast_radius_analysis;
  const paths = blastReport?.paths || {};
  const schemaMods = analysisResult.schema_modifications || {};
  const nodeDetails = blastReport?.node_details || {};

  const pathEntries = Object.entries(paths);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-xs">
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Evidence & Dependency Traces</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Proof of downstream propagation for target component{' '}
            <code className="font-mono text-slate-800">{blastReport?.start_node}</code>
          </p>
        </div>
        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-gray-200">
          {pathEntries.length} Traces Discovered
        </span>
      </div>

      {/* Schema Modifications Evidence */}
      {Object.keys(schemaMods).length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-600" />
            Detected Schema Modifications
          </span>
          <pre className="p-3 bg-slate-950 text-slate-100 text-xs font-mono rounded-md overflow-x-auto border border-slate-800">
            {JSON.stringify(schemaMods, null, 2)}
          </pre>
        </div>
      )}

      {/* Downstream Impact Traces */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
          <Route className="w-4 h-4 text-amber-600" />
          Impact Traversal Evidence
        </span>

        {pathEntries.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>No downstream component paths were affected by this specific change target.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pathEntries.map(([targetNode, pathList]) => {
              const detail = nodeDetails[targetNode];
              const criticality = detail?.criticality ?? 1.0;
              const depth = detail?.depth ?? 1;

              return (
                <div
                  key={targetNode}
                  className="p-4 bg-gray-50/70 border border-gray-200 rounded-lg flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      Impacted Component: <code className="font-mono text-indigo-600">{targetNode}</code>
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                        Depth: {depth}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium">
                        Criticality: {criticality}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Changes on <code className="font-mono">{blastReport?.start_node}</code> propagate to{' '}
                    <code className="font-mono">{targetNode}</code> via direct/indirect graph traversal:
                  </p>

                  <div className="flex flex-col gap-1.5 mt-1">
                    {pathList.map((singlePath, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded font-mono text-[11px] text-slate-800 flex items-center gap-2 overflow-x-auto"
                      >
                        <span className="text-gray-400 font-sans text-[10px]">Path #{idx + 1}:</span>
                        {singlePath.map((stepNode, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                stepNode === blastReport?.start_node
                                  ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                                  : stepNode === targetNode
                                  ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                                  : 'bg-gray-100 text-slate-800'
                              }`}
                            >
                              {stepNode}
                            </span>
                            {sIdx < singlePath.length - 1 && <span className="text-gray-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
