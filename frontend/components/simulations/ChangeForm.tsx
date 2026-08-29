'use client';

import React, { useState } from 'react';
import { ChangeTargetCategory } from '@/lib/types';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import { Play, RotateCcw, Loader2, AlertCircle } from 'lucide-react';

interface ChangeFormProps {
  onReset: () => void;
  isSimulated: boolean;
}

export default function ChangeForm({ onReset, isSimulated }: ChangeFormProps) {
  const { runSimulation, isLoading, error, clearError } = useChangeShieldStore();

  const [category, setCategory] = useState<ChangeTargetCategory>('Database');
  const [targetComponent, setTargetComponent] = useState('db-users');
  const [v1Sql, setV1Sql] = useState('CREATE TABLE users (id INT PRIMARY KEY);');
  const [v2Sql, setV2Sql] = useState('CREATE TABLE users (id UUID PRIMARY KEY);');
  const [description, setDescription] = useState(
    'Migrate customer identifier from integer to UUID format across system schema.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await runSimulation({
      target_component: targetComponent,
      v1_sql: v1Sql,
      v2_sql: v2Sql,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 shadow-xs"
    >
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-base font-semibold text-slate-900">Change Parameters</h2>
        <p className="text-xs text-gray-500 mt-0.5">Specify intended schema or service modification</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-red-600 hover:text-red-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Category Radio / Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Change Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Database', 'API'] as ChangeTargetCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-1.5 px-3 border rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                  category === cat
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Target Component */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Target Component (Start Node)</label>
          <input
            type="text"
            required
            value={targetComponent}
            onChange={(e) => setTargetComponent(e.target.value)}
            placeholder="e.g. db-users or user-service"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
        </div>

        {/* v1 SQL Schema */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Original Schema Statement (v1_sql)</label>
          <textarea
            rows={2}
            value={v1Sql}
            onChange={(e) => setV1Sql(e.target.value)}
            placeholder="CREATE TABLE users (id INT PRIMARY KEY);"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
        </div>

        {/* v2 SQL Schema */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Updated Schema Statement (v2_sql)</label>
          <textarea
            rows={2}
            value={v2Sql}
            onChange={(e) => setV2Sql(e.target.value)}
            placeholder="CREATE TABLE users (id UUID PRIMARY KEY);"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Description / Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Change description..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Analyzing dependencies...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Change</span>
            </>
          )}
        </button>

        {isSimulated && (
          <button
            type="button"
            onClick={onReset}
            title="Reset simulation graph"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors cursor-pointer border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
