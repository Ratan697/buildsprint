'use client';

import React, { useState } from 'react';
import { ChangeTargetCategory, SimulationFormData } from '@/lib/types';
import { Play } from 'lucide-react';

interface SimulationSetupProps {
  onSimulate?: (data: SimulationFormData) => void;
}

export default function SimulationSetup({ onSimulate }: SimulationSetupProps) {
  const [category, setCategory] = useState<ChangeTargetCategory>('Database');
  const [targetComponent, setTargetComponent] = useState('users.customer_id');
  const [changeType, setChangeType] = useState('modify_column_type');
  const [oldValue, setOldValue] = useState('INT');
  const [newValue, setNewValue] = useState('UUID');
  const [description, setDescription] = useState(
    'Migrate customer identifier from integer to UUID format across payment and user microservices.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSimulate) {
      onSimulate({
        category,
        targetComponent,
        changeType,
        oldValue,
        newValue,
        description,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-base font-semibold text-slate-900">Simulation Configuration</h2>
        <p className="text-xs text-gray-500 mt-0.5">Specify intended schema or API changes</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Category Radio / Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Target Type</label>
          <div className="grid grid-cols-2 gap-3">
            {(['Database', 'API'] as ChangeTargetCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 border rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat} Target
              </button>
            ))}
          </div>
        </div>

        {/* Target Component */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Target Component / Field</label>
          <input
            type="text"
            required
            value={targetComponent}
            onChange={(e) => setTargetComponent(e.target.value)}
            placeholder="e.g. users.customer_id or GET /v1/orders"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
        </div>

        {/* Change Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Change Type</label>
          <select
            value={changeType}
            onChange={(e) => setChangeType(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="modify_column_type">modify_column_type</option>
            <option value="remove_endpoint">remove_endpoint</option>
            <option value="rename_field">rename_field</option>
            <option value="deprecate_service">deprecate_service</option>
          </select>
        </div>

        {/* Old Value vs New Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Old Value</label>
            <input
              type="text"
              value={oldValue}
              onChange={(e) => setOldValue(e.target.value)}
              placeholder="INT"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">New Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Change Notes / Context</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the intended change..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Simulate Change</span>
        </button>
      </div>
    </form>
  );
}
