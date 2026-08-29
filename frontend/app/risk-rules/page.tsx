'use client';

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  X,
  Calculator,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Ban,
  Lock,
  RotateCcw,
  Edit3,
  Trash2,
  Copy,
  Flame,
  Info,
} from 'lucide-react';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type RuleCategory = 'Database Safety' | 'Schema Integrity' | 'Governance' | 'Blast Radius';
export type RuleAction = 'Block Migration' | 'Require Approval' | 'Warn Only';
export type RulePriority = 'P0 (Emergency)' | 'P1 (High)' | 'P2 (Standard)';

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: SeverityLevel;
  priority: RulePriority;
  targetPattern: string;
  triggerCondition: string;
  actionEnforced: RuleAction;
  isActive: boolean;
}

const DEFAULT_RULES: RiskRule[] = [
  {
    id: 'rule-1',
    name: 'Block Dropped Columns on Tier-1 DB',
    description: 'Prevents DDL migrations that drop columns from primary production databases without dual-phase deprecation.',
    category: 'Database Safety',
    severity: 'Critical',
    priority: 'P0 (Emergency)',
    targetPattern: 'db-users, db-orders',
    triggerCondition: 'When column drop statement is detected',
    actionEnforced: 'Block Migration',
    isActive: true,
  },
  {
    id: 'rule-2',
    name: 'Detect High Blast Radius Traversal (>3 Hops)',
    description: 'Flags schema changes that propagate beyond 3 downstream microservices in dependency graph analysis.',
    category: 'Blast Radius',
    severity: 'High',
    priority: 'P1 (High)',
    targetPattern: '*',
    triggerCondition: 'When blast radius depth > 3 hops',
    actionEnforced: 'Require Approval',
    isActive: true,
  },
  {
    id: 'rule-3',
    name: 'Prohibit Foreign Key Alterations in Production',
    description: 'Blocks dropping or modifying foreign key constraint rules in production without staging validation.',
    category: 'Schema Integrity',
    severity: 'High',
    priority: 'P1 (High)',
    targetPattern: 'env:production',
    triggerCondition: 'When foreign key constraint is altered',
    actionEnforced: 'Require Approval',
    isActive: true,
  },
  {
    id: 'rule-4',
    name: 'Flag Breaking OpenAPI Contract Changes',
    description: 'Detects removed endpoints or renamed request payload properties across public API gateway routes.',
    category: 'Governance',
    severity: 'Medium',
    priority: 'P2 (Standard)',
    targetPattern: 'api-gateway/*',
    triggerCondition: 'When API property is renamed or removed',
    actionEnforced: 'Warn Only',
    isActive: true,
  },
  {
    id: 'rule-5',
    name: 'Prohibit Table Truncation / Drop in Staging & Prod',
    description: 'Hard restriction blocking DROP TABLE or TRUNCATE commands across production and staging environments.',
    category: 'Database Safety',
    severity: 'Critical',
    priority: 'P0 (Emergency)',
    targetPattern: '*',
    triggerCondition: 'When DROP TABLE or TRUNCATE command is detected',
    actionEnforced: 'Block Migration',
    isActive: true,
  },
  {
    id: 'rule-6',
    name: 'Enforce Index Creation for Foreign Keys',
    description: 'Validates that new foreign key columns have corresponding indexes created to prevent full table scans.',
    category: 'Schema Integrity',
    severity: 'Low',
    priority: 'P2 (Standard)',
    targetPattern: 'db-*',
    triggerCondition: 'When foreign key column added without index',
    actionEnforced: 'Warn Only',
    isActive: false,
  },
];

export default function RiskRulesPage() {
  const [rules, setRules] = useState<RiskRule[]>(DEFAULT_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | RuleCategory>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<'All' | SeverityLevel>('All');

  // Risk Scoring Engine Weights Configurator State (sums to 100%)
  const [weightDepth, setWeightDepth] = useState(30);
  const [weightAffectedCount, setWeightAffectedCount] = useState(25);
  const [weightExternalExposure, setWeightExternalExposure] = useState(20);
  const [weightCriticality, setWeightCriticality] = useState(15);
  const [weightChangeSeverity, setWeightChangeSeverity] = useState(10);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalAllocatedWeight = useMemo(() => {
    return weightDepth + weightAffectedCount + weightExternalExposure + weightCriticality + weightChangeSeverity;
  }, [weightDepth, weightAffectedCount, weightExternalExposure, weightCriticality, weightChangeSeverity]);

  // Explainability Sandbox Playground State
  const [sandboxDepth, setSandboxDepth] = useState(4);
  const [sandboxAffectedCount, setSandboxAffectedCount] = useState(5);
  const [sandboxExternalApi, setSandboxExternalApi] = useState(true);
  const [sandboxCriticality, setSandboxCriticality] = useState(5.0);
  const [sandboxIsBreaking, setSandboxIsBreaking] = useState(true);

  // Calculate Explainability Sandbox Score (0.0 to 10.0)
  const sandboxCalculation = useMemo(() => {
    const normDepth = Math.min(sandboxDepth / 5, 1.0); // 5 hops = max
    const normAffected = Math.min(sandboxAffectedCount / 10, 1.0); // 10 nodes = max
    const normExternal = sandboxExternalApi ? 1.0 : 0.0;
    const normCriticality = sandboxCriticality / 5.0; // 5.0 = max
    const normBreaking = sandboxIsBreaking ? 1.0 : 0.2;

    const contribDepth = normDepth * (weightDepth / 10);
    const contribAffected = normAffected * (weightAffectedCount / 10);
    const contribExternal = normExternal * (weightExternalExposure / 10);
    const contribCriticality = normCriticality * (weightCriticality / 10);
    const contribBreaking = normBreaking * (weightChangeSeverity / 10);

    const totalRawScore = contribDepth + contribAffected + contribExternal + contribCriticality + contribBreaking;
    const finalScore = Math.min(Math.round(totalRawScore * 10) / 10, 10.0);

    return {
      finalScore,
      contribDepth: Math.round(contribDepth * 10) / 10,
      contribAffected: Math.round(contribAffected * 10) / 10,
      contribExternal: Math.round(contribExternal * 10) / 10,
      contribCriticality: Math.round(contribCriticality * 10) / 10,
      contribBreaking: Math.round(contribBreaking * 10) / 10,
    };
  }, [
    sandboxDepth,
    sandboxAffectedCount,
    sandboxExternalApi,
    sandboxCriticality,
    sandboxIsBreaking,
    weightDepth,
    weightAffectedCount,
    weightExternalExposure,
    weightCriticality,
    weightChangeSeverity,
  ]);

  // Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<RuleCategory>('Database Safety');
  const [formSeverity, setFormSeverity] = useState<SeverityLevel>('High');
  const [formPriority, setFormPriority] = useState<RulePriority>('P1 (High)');
  const [formTargetPattern, setFormTargetPattern] = useState('db-*');
  const [formTriggerCondition, setFormTriggerCondition] = useState('');
  const [formActionEnforced, setFormActionEnforced] = useState<RuleAction>('Block Migration');

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.triggerCondition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || rule.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'All' || rule.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [rules, searchQuery, selectedCategory, selectedSeverity]);

  // Handlers
  const handleResetWeights = () => {
    setWeightDepth(30);
    setWeightAffectedCount(25);
    setWeightExternalExposure(20);
    setWeightCriticality(15);
    setWeightChangeSeverity(10);
    triggerToast('Reset scoring model weights to default baseline.');
  };

  const handleSaveWeights = () => {
    if (totalAllocatedWeight !== 100) {
      triggerToast('Cannot save engine config: Total allocated weight must sum to exactly 100%.');
      return;
    }
    triggerToast('Saved updated Risk Scoring Engine mathematical weights.');
  };

  const handleToggleRuleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    triggerToast('Updated rule active state.');
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete rule "${name}"?`)) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      triggerToast(`Deleted rule "${name}".`);
    }
  };

  const handleDuplicateRule = (rule: RiskRule) => {
    const duplicated: RiskRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
    };
    setRules((prev) => [duplicated, ...prev]);
    triggerToast(`Duplicated rule "${rule.name}".`);
  };

  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('Database Safety');
    setFormSeverity('High');
    setFormPriority('P1 (High)');
    setFormTargetPattern('db-*');
    setFormTriggerCondition('');
    setFormActionEnforced('Block Migration');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: RiskRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormDescription(rule.description);
    setFormCategory(rule.category);
    setFormSeverity(rule.severity);
    setFormPriority(rule.priority);
    setFormTargetPattern(rule.targetPattern);
    setFormTriggerCondition(rule.triggerCondition);
    setFormActionEnforced(rule.actionEnforced);
    setIsModalOpen(true);
  };

  const handleSaveRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTriggerCondition.trim()) return;

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
                priority: formPriority,
                targetPattern: formTargetPattern.trim(),
                triggerCondition: formTriggerCondition.trim(),
                actionEnforced: formActionEnforced,
              }
            : r
        )
      );
      triggerToast(`Updated rule "${formName}".`);
    } else {
      const newRule: RiskRule = {
        id: `rule-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        severity: formSeverity,
        priority: formPriority,
        targetPattern: formTargetPattern.trim(),
        triggerCondition: formTriggerCondition.trim(),
        actionEnforced: formActionEnforced,
        isActive: true,
      };
      setRules((prev) => [newRule, ...prev]);
      triggerToast(`Created new rule "${formName}".`);
    }

    setIsModalOpen(false);
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-slate-900" />
            Risk Scoring Engine & Guardrail Rules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-factor weighted scoring model, automated CI/CD gating thresholds, and transparent explainability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetWeights}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset Baseline Weights</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Create Risk Rule</span>
          </button>
        </div>
      </div>

      {/* 1. Risk Scoring Model Weights Configurator */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Mathematical Risk Scoring Weight Configurator
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Adjust relative weight parameters across the 5 core blast radius dimensions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded text-xs font-bold font-mono border ${
                totalAllocatedWeight === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {totalAllocatedWeight === 100 ? '100% Allocated' : `Invalid Sum: ${totalAllocatedWeight}%`}
            </span>

            <button
              type="button"
              onClick={handleSaveWeights}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Save Engine Config
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          {/* Dimension 1 */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span>Depth Traversal</span>
              <span className="font-mono text-indigo-600 text-sm">{weightDepth}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={weightDepth}
              onChange={(e) => setWeightDepth(Number(e.target.value))}
              className="accent-slate-900 cursor-pointer"
            />
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Penalizes multi-hop transitive blast radii across downstream trees.
            </p>
          </div>

          {/* Dimension 2 */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span>Affected Count</span>
              <span className="font-mono text-indigo-600 text-sm">{weightAffectedCount}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={weightAffectedCount}
              onChange={(e) => setWeightAffectedCount(Number(e.target.value))}
              className="accent-slate-900 cursor-pointer"
            />
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Penalizes broad fan-out impact across multiple microservices.
            </p>
          </div>

          {/* Dimension 3 */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span>External APIs</span>
              <span className="font-mono text-indigo-600 text-sm">{weightExternalExposure}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={weightExternalExposure}
              onChange={(e) => setWeightExternalExposure(Number(e.target.value))}
              className="accent-slate-900 cursor-pointer"
            />
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Penalizes exposure on public gateways or external webhook integrations.
            </p>
          </div>

          {/* Dimension 4 */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span>Target Criticality</span>
              <span className="font-mono text-indigo-600 text-sm">{weightCriticality}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={weightCriticality}
              onChange={(e) => setWeightCriticality(Number(e.target.value))}
              className="accent-slate-900 cursor-pointer"
            />
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Accounts for Tier-1 vs Tier-3 database and service criticality rating.
            </p>
          </div>

          {/* Dimension 5 */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span>Change Breakingness</span>
              <span className="font-mono text-indigo-600 text-sm">{weightChangeSeverity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={weightChangeSeverity}
              onChange={(e) => setWeightChangeSeverity(Number(e.target.value))}
              className="accent-slate-900 cursor-pointer"
            />
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Differentiates DDL column drops from non-breaking additions.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Explainability Sandbox ("Why this score?") */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-2xs">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            Transparent Explainability Sandbox ("Why this score?")
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Test custom change parameters to inspect point-by-point mathematical contribution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Parameters Input Column */}
          <div className="lg:col-span-5 bg-gray-50/80 border border-gray-200 rounded-lg p-4 flex flex-col gap-4 text-xs">
            <span className="font-semibold text-slate-900">Test Scenario Parameters</span>

            {/* Depth */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Dependency Traversal Depth:</span>
                <span className="font-mono font-bold text-slate-900">{sandboxDepth} Hops</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={sandboxDepth}
                onChange={(e) => setSandboxDepth(Number(e.target.value))}
                className="accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Affected Nodes */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Impacted Components Count:</span>
                <span className="font-mono font-bold text-slate-900">{sandboxAffectedCount} Nodes</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sandboxAffectedCount}
                onChange={(e) => setSandboxAffectedCount(Number(e.target.value))}
                className="accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Target Criticality */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Target Component Criticality:</span>
                <span className="font-mono font-bold text-slate-900">{sandboxCriticality} / 5.0</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={sandboxCriticality}
                onChange={(e) => setSandboxCriticality(Number(e.target.value))}
                className="accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={sandboxExternalApi}
                  onChange={(e) => setSandboxExternalApi(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <span className="font-medium text-slate-800">External Gateway API</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={sandboxIsBreaking}
                  onChange={(e) => setSandboxIsBreaking(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <span className="font-medium text-slate-800">Breaking DDL Change</span>
              </label>
            </div>
          </div>

          {/* Mathematical Point-by-Point Breakdown Output Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Score Result Card */}
            <div className="p-4 bg-slate-950 text-white rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400">Calculated Scenario Risk Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-rose-400">{sandboxCalculation.finalScore}</span>
                  <span className="text-xs text-slate-400">/ 10.0 Rating</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded text-xs font-bold border ${
                  sandboxCalculation.finalScore >= 8.0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : sandboxCalculation.finalScore >= 5.0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {sandboxCalculation.finalScore >= 8.0
                  ? 'CRITICAL RISK'
                  : sandboxCalculation.finalScore >= 5.0
                  ? 'HIGH RISK'
                  : 'ACCEPTABLE'}
              </span>
            </div>

            {/* Factor Contribution Breakdown Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-medium">
                    <th className="pb-2">Factor Dimension</th>
                    <th className="pb-2">Weight %</th>
                    <th className="pb-2">Input Value</th>
                    <th className="pb-2 text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  <tr>
                    <td className="py-2 font-sans font-medium text-slate-900">Dependency Depth</td>
                    <td className="py-2 text-gray-500">{weightDepth}%</td>
                    <td className="py-2 text-slate-800">{sandboxDepth} Hops</td>
                    <td className="py-2 text-right font-bold text-indigo-600">+{sandboxCalculation.contribDepth}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans font-medium text-slate-900">Affected Components</td>
                    <td className="py-2 text-gray-500">{weightAffectedCount}%</td>
                    <td className="py-2 text-slate-800">{sandboxAffectedCount} Nodes</td>
                    <td className="py-2 text-right font-bold text-indigo-600">+{sandboxCalculation.contribAffected}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans font-medium text-slate-900">External Exposure</td>
                    <td className="py-2 text-gray-500">{weightExternalExposure}%</td>
                    <td className="py-2 text-slate-800">{sandboxExternalApi ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-right font-bold text-indigo-600">+{sandboxCalculation.contribExternal}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans font-medium text-slate-900">Target Criticality</td>
                    <td className="py-2 text-gray-500">{weightCriticality}%</td>
                    <td className="py-2 text-slate-800">{sandboxCriticality} / 5.0</td>
                    <td className="py-2 text-right font-bold text-indigo-600">+{sandboxCalculation.contribCriticality}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans font-medium text-slate-900">Change Severity</td>
                    <td className="py-2 text-gray-500">{weightChangeSeverity}%</td>
                    <td className="py-2 text-slate-800">{sandboxIsBreaking ? 'Breaking DDL' : 'Additive'}</td>
                    <td className="py-2 text-right font-bold text-indigo-600">+{sandboxCalculation.contribBreaking}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Severity Action Gating Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800">Critical (≥ 8.0)</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-rose-700 leading-relaxed">
            Auto-blocks CI/CD deployment pipeline, requires dual-architect override, and posts PagerDuty incident.
          </p>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-800">High (6.0 - 7.9)</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-amber-700 leading-relaxed">
            Requires explicit sign-off from lead codeowner and dual staging migration dry-run pass.
          </p>
        </div>

        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-800">Medium (4.0 - 5.9)</span>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-blue-700 leading-relaxed">
            Posts detailed PR blast radius report comments and requests standard peer code review.
          </p>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800">Low (&lt; 4.0)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-emerald-700 leading-relaxed">
            Auto-approved for merge and recorded in executive compliance audit trail.
          </p>
        </div>
      </div>

      {/* 4. Active Guardrail Rules Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Active Policy Rules</h2>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules..."
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'All' | RuleCategory)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-slate-900 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Database Safety">Database Safety</option>
              <option value="Schema Integrity">Schema Integrity</option>
              <option value="Governance">Governance</option>
              <option value="Blast Radius">Blast Radius</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                <th className="pb-3 pl-1 text-center">Status</th>
                <th className="pb-3 px-3">Rule Name & Details</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Priority</th>
                <th className="pb-3 px-3">Severity</th>
                <th className="pb-3 px-3">Enforcement</th>
                <th className="pb-3 pr-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Status Toggle */}
                  <td className="py-4 pl-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRuleStatus(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        rule.isActive ? 'bg-slate-900' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                          rule.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Name & Description */}
                  <td className="py-4 px-3 max-w-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-900 text-xs">{rule.name}</span>
                      <span className="text-[11px] text-gray-500 truncate">{rule.description}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-3">
                    <span className="inline-block text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                      {rule.category}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-3 font-mono text-xs text-slate-800">{rule.priority}</td>

                  {/* Severity */}
                  <td className="py-4 px-3">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${getSeverityBadgeClass(
                        rule.severity
                      )}`}
                    >
                      {rule.severity}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-3 text-xs font-medium text-slate-800">{rule.actionEnforced}</td>

                  {/* Actions */}
                  <td className="py-4 pr-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(rule)}
                        className="p-1.5 text-gray-400 hover:text-slate-900 rounded cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateRule(rule)}
                        className="p-1.5 text-gray-400 hover:text-slate-900 rounded cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rule Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {editingRuleId ? 'Edit Risk Policy Rule' : 'Create New Risk Policy Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Rule Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Block Dropped Columns on Tier-1 DB"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Rule description..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RuleCategory)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RulePriority)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="P0 (Emergency)">P0 (Emergency)</option>
                    <option value="P1 (High)">P1 (High)</option>
                    <option value="P2 (Standard)">P2 (Standard)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-700">Action Enforced</label>
                  <select
                    value={formActionEnforced}
                    onChange={(e) => setFormActionEnforced(e.target.value as RuleAction)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Block Migration">Block Migration</option>
                    <option value="Require Approval">Require Approval</option>
                    <option value="Warn Only">Warn Only</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-700">Trigger Condition</label>
                <input
                  type="text"
                  required
                  value={formTriggerCondition}
                  onChange={(e) => setFormTriggerCondition(e.target.value)}
                  placeholder="e.g. When column is dropped on Tier-1 DB"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

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
                  {editingRuleId ? 'Save Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
