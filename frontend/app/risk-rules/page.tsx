'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  Flame,
  Ban,
  Lock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type RuleCategory = 'Database Safety' | 'Schema Integrity' | 'Governance' | 'Blast Radius';
export type RuleAction = 'Block Migration' | 'Require Approval' | 'Warn Only';

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: SeverityLevel;
  targetObject: string;
  triggerCondition: string;
  actionEnforced: RuleAction;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_RULES: RiskRule[] = [
  {
    id: 'rule-1',
    name: 'Block Dropped Columns on Tier-1 DB',
    description: 'Prevents DDL migrations that drop columns from primary production databases without prior deprecation window.',
    category: 'Database Safety',
    severity: 'Critical',
    targetObject: 'Column',
    triggerCondition: 'When column is dropped on Tier-1 database',
    actionEnforced: 'Block Migration',
    isActive: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'rule-2',
    name: 'Warn on Breaking Foreign Key Alterations',
    description: 'Triggers automated developer warnings when modifying foreign key constraints or data types.',
    category: 'Schema Integrity',
    severity: 'High',
    targetObject: 'Table / Relation',
    triggerCondition: 'When foreign key constraint or type is altered',
    actionEnforced: 'Warn Only',
    isActive: true,
    createdAt: '2026-08-05',
  },
  {
    id: 'rule-3',
    name: 'Require Multi-Review for Criticality > 4.0',
    description: 'Enforces dual-architect approval for changes impacting core services with high risk criticality ratings.',
    category: 'Governance',
    severity: 'Medium',
    targetObject: 'System / Service',
    triggerCondition: 'When target service criticality rating exceeds 4.0',
    actionEnforced: 'Require Approval',
    isActive: true,
    createdAt: '2026-08-10',
  },
  {
    id: 'rule-4',
    name: 'Detect High Blast Radius Traversal (>3 Hops)',
    description: 'Flags schema changes that propagate beyond 3 downstream microservices in dependency graph analysis.',
    category: 'Blast Radius',
    severity: 'High',
    targetObject: 'Graph Topology',
    triggerCondition: 'When blast radius traversal exceeds 3 dependency hops',
    actionEnforced: 'Require Approval',
    isActive: true,
    createdAt: '2026-08-12',
  },
  {
    id: 'rule-5',
    name: 'Prohibit Table Truncation / Drop in Staging & Prod',
    description: 'Hard restriction blocking DROP TABLE or TRUNCATE commands across production and staging environments.',
    category: 'Database Safety',
    severity: 'Critical',
    targetObject: 'Table',
    triggerCondition: 'When DROP TABLE or TRUNCATE command is detected',
    actionEnforced: 'Block Migration',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'rule-6',
    name: 'Enforce Index Creation for Foreign Keys',
    description: 'Validates that new foreign key columns have corresponding indexes created to prevent full table scans.',
    category: 'Schema Integrity',
    severity: 'Low',
    targetObject: 'Index',
    triggerCondition: 'When new foreign key column is added without index',
    actionEnforced: 'Warn Only',
    isActive: false,
    createdAt: '2026-08-18',
  },
];

const CATEGORIES: ('All' | RuleCategory)[] = [
  'All',
  'Database Safety',
  'Schema Integrity',
  'Governance',
  'Blast Radius',
];

const SEVERITIES: ('All Severities' | SeverityLevel)[] = [
  'All Severities',
  'Critical',
  'High',
  'Medium',
  'Low',
];

export default function RiskRulesPage() {
  const [rules, setRules] = useState<RiskRule[]>(DEFAULT_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | RuleCategory>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<'All Severities' | SeverityLevel>('All Severities');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State inside Modal
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<RuleCategory>('Database Safety');
  const [formSeverity, setFormSeverity] = useState<SeverityLevel>('High');
  const [formTargetObject, setFormTargetObject] = useState('Table');
  const [formTriggerCondition, setFormTriggerCondition] = useState('');
  const [formActionEnforced, setFormActionEnforced] = useState<RuleAction>('Block Migration');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback Banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Metrics Calculation
  const activeCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);
  const criticalCount = useMemo(
    () => rules.filter((r) => r.isActive && r.severity === 'Critical').length,
    [rules]
  );
  const autoBlockedThisMonth = 14;

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.triggerCondition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || rule.category === selectedCategory;

      const matchesSeverity =
        selectedSeverity === 'All Severities' || rule.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [rules, searchQuery, selectedCategory, selectedSeverity]);

  // Handlers
  const handleToggleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextState = !r.isActive;
          showNotification(
            `Rule "${r.name}" is now ${nextState ? 'Active' : 'Inactive'}.`
          );
          return { ...r, isActive: nextState };
        }
        return r;
      })
    );
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete guardrail "${name}"?`)) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      showNotification(`Guardrail "${name}" deleted successfully.`);
    }
  };

  const handleDuplicateRule = (rule: RiskRule) => {
    const duplicated: RiskRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRules((prev) => [duplicated, ...prev]);
    showNotification(`Duplicated "${rule.name}".`);
  };

  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('Database Safety');
    setFormSeverity('High');
    setFormTargetObject('Table');
    setFormTriggerCondition('');
    setFormActionEnforced('Block Migration');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: RiskRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormDescription(rule.description);
    setFormCategory(rule.category);
    setFormSeverity(rule.severity);
    setFormTargetObject(rule.targetObject);
    setFormTriggerCondition(rule.triggerCondition);
    setFormActionEnforced(rule.actionEnforced);
    setFormIsActive(rule.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Rule Name is required.');
      return;
    }
    if (!formTriggerCondition.trim()) {
      setFormError('Trigger Condition is required.');
      return;
    }

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                name: formName.trim(),
                description: formDescription.trim(),
                category: formCategory,
                severity: formSeverity,
                targetObject: formTargetObject.trim(),
                triggerCondition: formTriggerCondition.trim(),
                actionEnforced: formActionEnforced,
                isActive: formIsActive,
              }
            : r
        )
      );
      showNotification(`Guardrail "${formName}" updated.`);
    } else {
      const newRule: RiskRule = {
        id: `rule-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        severity: formSeverity,
        targetObject: formTargetObject.trim(),
        triggerCondition: formTriggerCondition.trim(),
        actionEnforced: formActionEnforced,
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRules((prev) => [newRule, ...prev]);
      showNotification(`New guardrail "${formName}" created.`);
    }

    setIsModalOpen(false);
  };

  const handleSimulatePolicies = () => {
    showNotification('Evaluated all active guardrails against current system topology. 0 conflicts found.');
  };

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-slate-900" />
            Risk Rules & Guardrails
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated policy governance, DDL safety constraints, and architectural change controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulatePolicies}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Simulate Policies</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Guardrail</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Guardrails</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{activeCount}</span>
            <span className="text-xs text-gray-500">of {rules.length} configured</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Critical Enforcement</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{criticalCount}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
              High Severity
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Auto-Blocked Changes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">{autoBlockedThisMonth}</span>
            <span className="text-xs text-gray-500">this month</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Evaluation Mode</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Enforced (Strict)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Chips & Severity Dropdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules by name, description, or condition..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as 'All Severities' | SeverityLevel)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs / Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400 shrink-0 mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Configured Guardrail Policies</h2>
          <span className="text-xs text-gray-500">Showing {filteredRules.length} rules</span>
        </div>

        {filteredRules.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <AlertTriangle className="w-8 h-8 text-gray-300" />
            <span className="text-sm font-semibold text-slate-900">No Matching Guardrails</span>
            <span className="text-xs text-gray-500">
              Try adjusting your search query or severity/category filters.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pl-1">Rule Name & Details</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Trigger / Target</th>
                  <th className="pb-3 px-3">Severity</th>
                  <th className="pb-3 px-3">Enforcement</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 pr-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRules.map((rule) => {
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name & Description */}
                      <td className="py-4 pl-1 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900">{rule.name}</span>
                          <span className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {rule.description}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3">
                        <span className="inline-block text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 whitespace-nowrap">
                          {rule.category}
                        </span>
                      </td>

                      {/* Trigger Condition & Target */}
                      <td className="py-4 px-3 max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono text-slate-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/80 truncate">
                            {rule.triggerCondition}
                          </span>
                          <span className="text-[11px] text-gray-400">Target: {rule.targetObject}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded border ${getSeverityBadgeClass(
                            rule.severity
                          )}`}
                        >
                          {rule.severity}
                        </span>
                      </td>

                      {/* Enforcement Action */}
                      <td className="py-4 px-3">
                        <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                          {rule.actionEnforced === 'Block Migration' && (
                            <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          {rule.actionEnforced === 'Require Approval' && (
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          {rule.actionEnforced === 'Warn Only' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          {rule.actionEnforced}
                        </span>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-4 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(rule.id)}
                          aria-label={`Toggle rule ${rule.name}`}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                            rule.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              rule.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            title="Edit Guardrail"
                            className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateRule(rule)}
                            title="Duplicate Guardrail"
                            className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                            title="Delete Guardrail"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {editingRuleId ? 'Edit Guardrail Rule' : 'Create New Guardrail Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRule} className="flex flex-col gap-4 text-xs">
              {/* Rule Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Rule Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Block Dropped Columns on Production DB"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain why this rule exists and its enforcement objective..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Category & Severity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RuleCategory)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Database Safety">Database Safety</option>
                    <option value="Schema Integrity">Schema Integrity</option>
                    <option value="Governance">Governance</option>
                    <option value="Blast Radius">Blast Radius</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Severity Level</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Target Object & Action Enforced Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Target Object</label>
                  <input
                    type="text"
                    value={formTargetObject}
                    onChange={(e) => setFormTargetObject(e.target.value)}
                    placeholder="e.g. Table, Column, Index"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Enforcement Action</label>
                  <select
                    value={formActionEnforced}
                    onChange={(e) => setFormActionEnforced(e.target.value as RuleAction)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Block Migration">Block Migration</option>
                    <option value="Require Approval">Require Approval</option>
                    <option value="Warn Only">Warn Only</option>
                  </select>
                </div>
              </div>

              {/* Trigger Condition */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Trigger Condition</label>
                <input
                  type="text"
                  required
                  value={formTriggerCondition}
                  onChange={(e) => setFormTriggerCondition(e.target.value)}
                  placeholder="e.g. When column is dropped on Tier-1 DB"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              {/* Active Toggle Option */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <input
                  type="checkbox"
                  id="modalFormIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="modalFormIsActive" className="font-medium text-gray-700 cursor-pointer">
                  Enable Guardrail Rule immediately upon saving
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  {editingRuleId ? 'Save Changes' : 'Create Guardrail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
