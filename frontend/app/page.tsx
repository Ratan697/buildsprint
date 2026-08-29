'use client';

import React from 'react';
import {
  OVERVIEW_SUMMARY_CARDS,
  RECENT_SIMULATIONS,
  RISK_DISTRIBUTION,
  HOW_IT_WORKS_STEPS,
} from '@/lib/constants';

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Overview Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Predict. Prevent. Protect.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_SUMMARY_CARDS.map((card) => {
          let badgeStyle = 'text-slate-900 bg-gray-100 border-gray-200';
          if (card.type === 'high') {
            badgeStyle = 'text-red-700 bg-red-50 border-red-200';
          } else if (card.type === 'medium') {
            badgeStyle = 'text-amber-700 bg-amber-50 border-amber-200';
          } else if (card.type === 'low') {
            badgeStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          }

          return (
            <div
              key={card.title}
              className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between"
            >
              <span className="text-sm font-medium text-gray-500">{card.title}</span>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded border ${badgeStyle}`}
                >
                  {card.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Simulations & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Simulations Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Simulations</h2>
            <span className="text-xs text-gray-500">Last 5 simulations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pl-1">Simulation Name</th>
                  <th className="pb-3 px-3">Risk Level</th>
                  <th className="pb-3 pr-1 text-right">Executed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {RECENT_SIMULATIONS.map((item) => {
                  let riskBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  if (item.risk === 'High') {
                    riskBadge = 'text-red-700 bg-red-50 border-red-200';
                  } else if (item.risk === 'Medium') {
                    riskBadge = 'text-amber-700 bg-amber-50 border-amber-200';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pl-1 font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${riskBadge}`}
                        >
                          {item.risk}
                        </span>
                      </td>
                      <td className="py-3 pr-1 text-right text-xs text-gray-500">{item.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Risk Distribution</h2>
            <p className="text-xs text-gray-500 mt-0.5">Categorized across 12 total runs</p>
          </div>

          {/* Clean SVG Donut Chart */}
          <div className="flex items-center justify-center relative my-2">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* High Risk (3/12 = 25%) */}
              <path
                className="text-red-500"
                strokeDasharray="25, 100"
                strokeDashoffset="0"
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Medium Risk (5/12 = 41.6%) */}
              <path
                className="text-amber-500"
                strokeDasharray="41.6, 100"
                strokeDashoffset="-25"
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Low Risk (4/12 = 33.3%) */}
              <path
                className="text-emerald-500"
                strokeDasharray="33.3, 100"
                strokeDashoffset="-66.6"
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-slate-900">12</span>
              <span className="text-xs text-gray-500">Simulations</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            {RISK_DISTRIBUTION.map((dist) => (
              <div key={dist.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dist.color}`} />
                  <span className="text-gray-600">{dist.label} Risk</span>
                </div>
                <span className="font-semibold text-slate-900">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How ChangeShield Works */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">How ChangeShield Works</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            End-to-end impact prediction workflow
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200/80 flex flex-col gap-2"
            >
              <div className="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold text-slate-900 flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
