'use client';

import React from 'react';
import { SourceType } from '@/lib/types';
import { GitBranch, FileCode, Database, FileJson } from 'lucide-react';

interface SourceSelectorProps {
  selectedSource: SourceType;
  onSelectSource: (source: SourceType) => void;
  disabled?: boolean;
}

export default function SourceSelector({
  selectedSource,
  onSelectSource,
  disabled = false,
}: SourceSelectorProps) {
  const sources = [
    {
      id: 'github' as SourceType,
      title: 'GitHub Repository',
      description: 'Connect repository directly to analyze codebase & endpoints.',
      icon: GitBranch,
    },
    {
      id: 'openapi' as SourceType,
      title: 'OpenAPI Spec',
      description: 'Upload OpenAPI/Swagger definition (.json, .yaml, .yml).',
      icon: FileCode,
    },
    {
      id: 'sql' as SourceType,
      title: 'SQL Schema',
      description: 'Upload SQL DDL schema files (.sql) to map tables & keys.',
      icon: Database,
    },
    {
      id: 'services_json' as SourceType,
      title: 'services.json',
      description: 'Provide custom service topology manifest (.json).',
      icon: FileJson,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {sources.map((src) => {
        const Icon = src.icon;
        const isSelected = selectedSource === src.id;

        return (
          <button
            key={src.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSource(src.id)}
            className={`p-4 rounded-lg border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              isSelected
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-900 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`p-2 rounded-md ${
                  isSelected ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-white bg-white' : 'border-gray-300 bg-transparent'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
              </div>
            </div>

            <div>
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isSelected ? 'text-white' : 'text-slate-900'
                }`}
              >
                {src.title}
              </h3>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isSelected ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {src.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
