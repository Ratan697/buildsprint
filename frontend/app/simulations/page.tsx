'use client';

import React, { useState } from 'react';
import SimulationSetup from '@/components/simulations/SimulationSetup';
import { SimulationItem } from '@/lib/types';
import { Plus, PlaySquare, Inbox } from 'lucide-react';
import Link from 'next/link';

const initialSimulations: SimulationItem[] = [
  {
    id: 'sim-101',
    name: 'Update User Service API',
    category: 'API',
    target: 'PUT /v1/users/profile',
    risk: 'High',
    executedAt: '10 mins ago',
    status: 'Completed',
  },
  {
    id: 'sim-102',
    name: 'Modify Orders Table Schema',
    category: 'Database',
    target: 'orders.customer_id',
    risk: 'Medium',
    executedAt: '1 hour ago',
    status: 'Completed',
  },
  {
    id: 'sim-103',
    name: 'Change Payment Gateway',
    category: 'API',
    target: 'POST /v2/payments/charge',
    risk: 'High',
    executedAt: '3 hours ago',
    status: 'Completed',
  },
  {
    id: 'sim-104',
    name: 'Update Environment Variable',
    category: 'System',
    target: 'JWT_SIGNING_KEY',
    risk: 'Low',
    executedAt: '5 hours ago',
    status: 'Completed',
  },
  {
    id: 'sim-105',
    name: 'Upgrade Notification Service',
    category: 'API',
    target: 'POST /v1/notify',
    risk: 'Medium',
    executedAt: '1 day ago',
    status: 'Completed',
  },
];

export default function SimulationsPage() {
  const [showSetup, setShowSetup] = useState(false);
  const [simulations, setSimulations] = useState<SimulationItem[]>(initialSimulations);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Simulations</h1>
          <p className="text-sm text-gray-500 mt-1">Run and inspect architectural change simulations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/simulations/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Interactive Simulation Workspace</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowSetup(!showSetup)}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {showSetup ? 'Hide Inline Form' : 'Quick Form'}
          </button>
        </div>
      </div>

      {/* Conditional Setup Form */}
      {showSetup && (
        <SimulationSetup
          onSimulate={(formData) => {
            const newItem: SimulationItem = {
              id: `sim-${Date.now().toString().slice(-3)}`,
              name: `Simulate ${formData.targetComponent}`,
              category: formData.category,
              target: formData.targetComponent,
              risk: 'High',
              executedAt: 'Just now',
              status: 'Completed',
            };
            setSimulations([newItem, ...simulations]);
            setShowSetup(false);
          }}
        />
      )}

      {/* Recent Simulations List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <PlaySquare className="w-4 h-4 text-slate-900" />
            <h2 className="text-base font-semibold text-slate-900">Simulation History</h2>
          </div>
          <span className="text-xs text-gray-500">{simulations.length} total runs</span>
        </div>

        {simulations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <Inbox className="w-8 h-8 text-gray-300" />
            <span className="text-sm font-semibold text-slate-900">No Simulations Found</span>
            <span className="text-xs text-gray-500">Run your first simulation using the action above.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pl-1">Simulation Name</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Target Component</th>
                  <th className="pb-3 px-3">Risk Assessment</th>
                  <th className="pb-3 pr-1 text-right">Executed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {simulations.map((sim) => {
                  let riskBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  if (sim.risk === 'High') {
                    riskBadge = 'text-red-700 bg-red-50 border-red-200';
                  } else if (sim.risk === 'Medium') {
                    riskBadge = 'text-amber-700 bg-amber-50 border-amber-200';
                  }

                  return (
                    <tr key={sim.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-1 font-medium text-slate-900">{sim.name}</td>
                      <td className="py-3.5 px-3 text-xs text-gray-500 font-mono">{sim.category}</td>
                      <td className="py-3.5 px-3 text-xs font-mono text-slate-700">{sim.target}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${riskBadge}`}
                        >
                          {sim.risk} Risk
                        </span>
                      </td>
                      <td className="py-3.5 pr-1 text-right text-xs text-gray-500">
                        {sim.executedAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
