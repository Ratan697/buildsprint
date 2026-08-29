'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Sliders,
  X,
} from 'lucide-react';

interface RiskRule {
  id: string;
  name: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  active: boolean;
  category: string;
}

const INITIAL_RULES: RiskRule[] = [
  {
    id: 'rule-1',
    name: 'Block Dropped Columns on Tier-1 DB',
    description: 'Prohibit dropping existing database columns on production Tier-1 databases without migration window.',
    severity: 'Critical',
    active: true,
    category: 'Database Safety',
  },
  {
    id: 'rule-2',
    name: 'Warn on Breaking Foreign Key Alterations',
    description: 'Flag any schema change that removes or alters foreign key constraints on active tables.',
    severity: 'High',
    active: true,
    category: 'Schema Integrity',
  },
  {
    id: 'rule-3',
    name: 'Require Multi-Review for Criticality > 4.0',
    description: 'Require at least 2 approval reviews if the impacted component criticality exceeds 4.0.',
    severity: 'Medium',
    active: true,
    category: 'Governance',
  },
  {
    id: 'rule-4',
    name: 'Detect High Blast Radius Traversal (>3 Hops)',
    description: 'Trigger a high-risk alert if a change impacts services more than 3 graph hops away.',
    severity: 'High',
    active: false,
    category: 'Blast Radius',
  },
];

export default function RiskRulesPage() {
  const [rules, setRules] = useState<RiskRule[]>(INITIAL_RULES);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newRuleCategory, setNewRuleCategory] = useState('Schema Safety');

  const toggleRuleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: RiskRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      description: newRuleDesc.trim() || 'Custom guardrail rule',
      severity: newRuleSeverity,
      active: true,
      category: newRuleCategory,
    };

    setRules([newRule, ...rules]);
    setNewRuleName('');
    setNewRuleDesc('');
    setShowAddModal(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Risk Rules & Guardrails
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated policy rules, compliance constraints, and risk thresholds for schema migrations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Guardrail Rule</span>
        </button>
      </div>

      {/* Rules Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-900" />
            <h2 className="font-semibold text-sm text-slate-900">
              Active Policy Rules ({rules.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Rule Name & Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {rule.name}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5 max-w-lg">
                      {rule.description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">
                    {rule.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityBadge(
                        rule.severity
                      )}`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRuleStatus(rule.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                        rule.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          rule.active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{rule.active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-semibold text-sm text-slate-900">
                Add New Guardrail Rule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Reject Column Renames Without Alias"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  rows={3}
                  placeholder="Explain what this rule enforces..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Save Guardrail Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
