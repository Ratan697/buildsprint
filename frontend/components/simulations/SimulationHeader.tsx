'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlaySquare } from 'lucide-react';

interface SimulationHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function SimulationHeader({
  title = 'Simulate Change',
  subtitle = 'Predict the blast radius before deployment.',
}: SimulationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link
            href="/simulations"
            className="text-xs font-medium text-gray-500 hover:text-slate-900 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-slate-900 rounded px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Simulations
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
          <PlaySquare className="w-6 h-6 text-slate-900" />
          {title}
        </h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
          FastAPI Connected
        </span>
      </div>
    </div>
  );
}
