'use client';

import React from 'react';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import { Wrench, CheckCircle2, ShieldCheck, TestTube2, Info } from 'lucide-react';

export default function RemediationPanel() {
  const { analysisResult } = useChangeShieldStore();

  if (!analysisResult) return null;

  const blastReport = analysisResult.blast_radius_analysis;
  const startNode = blastReport?.start_node || 'Target';
  const impactedNodes = blastReport?.impacted_nodes || [];
  const riskScore = blastReport?.risk_score || 0;

  const remediationSteps = [
    {
      title: 'Database Compatibility Shim & Migration',
      description: `Create an abstraction layer or dual-write column migration strategy on '${startNode}' before cutting over types or removing fields.`,
      action: 'Apply Non-Breaking Schema Migration',
    },
    {
      title: 'Downstream Service ORM Model Sync',
      description: `Update data models, SQL queries, and type contracts across affected services (${
        impactedNodes.length > 0 ? impactedNodes.join(', ') : 'None'
      }) to support updated schema definitions.`,
      action: 'Sync Microservice Repositories',
    },
    {
      title: 'API Version Gateway Guardrails',
      description: `Deprecate existing API contract endpoints gradually with clear backwards compatibility headers prior to final schema cutover.`,
      action: 'Deploy Gateway Facade',
    },
  ];

  const testRecommendations = [
    `Run end-to-end integration test suites across affected targets: ${
      impactedNodes.length > 0 ? impactedNodes.join(', ') : startNode
    }.`,
    `Execute staging regression tests with dual-schema reads enabled.`,
    `Verify API gateway contract validations for request payload compatibility.`,
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-xs">
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Remediation & Mitigation Plan</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Recommended safety actions for risk score <span className="font-semibold text-slate-900">{riskScore}</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Safety Action Plan Ready
        </span>
      </div>

      {/* Remediation Action Steps */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-indigo-600" />
          Actionable Mitigation Steps
        </span>

        {remediationSteps.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>No specific remediation steps required for this change.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {remediationSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50/70 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {step.action}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Testing Strategy */}
      <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
          <TestTube2 className="w-4 h-4 text-emerald-600" />
          Recommended Testing Suite
        </span>

        <ul className="flex flex-col gap-2">
          {testRecommendations.map((rec, idx) => (
            <li
              key={idx}
              className="px-3 py-2 bg-emerald-50/40 border border-emerald-200/60 rounded text-xs text-slate-800 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
