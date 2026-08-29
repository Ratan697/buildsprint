'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  Database,
  Cpu,
  Server,
  X,
  Info,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface DependencyNode {
  id: string;
  name: string;
  type: 'database' | 'backend' | 'gateway';
  criticality: number;
  tier: string;
  x: number;
  y: number;
}

interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

const INITIAL_NODES: DependencyNode[] = [
  { id: 'api-gateway', name: 'API Gateway', type: 'gateway', criticality: 3.0, tier: 'Tier-1', x: 100, y: 180 },
  { id: 'auth-service', name: 'Authentication Service', type: 'backend', criticality: 5.0, tier: 'Tier-1', x: 380, y: 80 },
  { id: 'order-service', name: 'Order Service', type: 'backend', criticality: 4.0, tier: 'Tier-2', x: 380, y: 280 },
  { id: 'payment-service', name: 'Payment Service', type: 'backend', criticality: 5.0, tier: 'Tier-1', x: 660, y: 280 },
  { id: 'db-users', name: 'Users Database', type: 'database', criticality: 5.0, tier: 'Tier-1', x: 660, y: 80 },
  { id: 'db-orders', name: 'Orders Database', type: 'database', criticality: 5.0, tier: 'Tier-1', x: 940, y: 280 },
];

const INITIAL_EDGES: DependencyEdge[] = [
  { id: 'e1', source: 'api-gateway', target: 'auth-service', relation: 'calls' },
  { id: 'e2', source: 'api-gateway', target: 'order-service', relation: 'calls' },
  { id: 'e3', source: 'order-service', target: 'auth-service', relation: 'depends_on' },
  { id: 'e4', source: 'order-service', target: 'payment-service', relation: 'calls' },
  { id: 'e5', source: 'auth-service', target: 'db-users', relation: 'reads_writes' },
  { id: 'e6', source: 'order-service', target: 'db-orders', relation: 'reads_writes' },
  { id: 'e7', source: 'payment-service', target: 'db-orders', relation: 'reads_writes' },
];

export default function DependenciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const filteredNodes = useMemo(() => {
    return INITIAL_NODES.filter((node) => {
      const matchesSearch =
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'database' && node.type === 'database') ||
        (categoryFilter === 'backend' && node.type === 'backend') ||
        (categoryFilter === 'gateway' && node.type === 'gateway');

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const selectedNode = useMemo(() => {
    return INITIAL_NODES.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  const incomingCallers = useMemo(() => {
    if (!selectedNodeId) return [];
    return INITIAL_EDGES.filter((e) => e.target === selectedNodeId).map((e) => e.source);
  }, [selectedNodeId]);

  const outgoingTargets = useMemo(() => {
    if (!selectedNodeId) return [];
    return INITIAL_EDGES.filter((e) => e.source === selectedNodeId).map((e) => e.target);
  }, [selectedNodeId]);

  const totalNodes = INITIAL_NODES.length;
  const totalEdges = INITIAL_EDGES.length;
  const criticalCount = INITIAL_NODES.filter((n) => n.criticality >= 4.5).length;

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'database':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'gateway':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'backend':
      default:
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-300';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Architecture Topology Viewer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore live multi-tier service dependencies, call graphs, and database relations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center space-x-2 text-xs">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="text-slate-500">Nodes:</span>
            <span className="font-bold text-slate-900">{totalNodes}</span>
          </div>

          <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center space-x-2 text-xs">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-500">Edges:</span>
            <span className="font-bold text-slate-900">{totalEdges}</span>
          </div>

          <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center space-x-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="text-slate-500">Critical:</span>
            <span className="font-bold text-slate-900">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search component ID or name..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Components</option>
            <option value="database">Databases</option>
            <option value="backend">Backend Services</option>
            <option value="gateway">Gateways</option>
          </select>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-xs p-6 min-h-[520px] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

          <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
            <span>Interactive Dependency Canvas</span>
            <span>Click any node to open Inspector</span>
          </div>

          {/* Interactive Graph Nodes Representation */}
          <div className="relative z-10 my-auto py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${getNodeColor(
                    node.type
                  )} ${
                    isSelected
                      ? 'ring-2 ring-slate-900 scale-105 shadow-md'
                      : 'hover:scale-102 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {node.type === 'database' && <Database className="w-4 h-4" />}
                      {node.type === 'gateway' && <Server className="w-4 h-4" />}
                      {node.type === 'backend' && <Cpu className="w-4 h-4" />}
                      <span className="font-semibold text-xs truncate">{node.name}</span>
                    </div>
                  </div>
                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>ID: {node.id}</span>
                    <span className="font-bold">Crit: {node.criticality}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Live Health: All Services Operational</span>
            </span>
            <span>Showing {filteredNodes.length} of {totalNodes} nodes</span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-slate-900">
                Component Inspector
              </h3>
            </div>
            {selectedNodeId && (
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Component ID</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedNode.id}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Full Name</span>
                <span className="font-medium text-slate-800">
                  {selectedNode.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Type</span>
                  <span className="capitalize font-semibold text-slate-900">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Criticality</span>
                  <span className="font-bold text-amber-600">
                    {selectedNode.criticality} / 5.0
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Incoming Callers ({incomingCallers.length})</span>
                {incomingCallers.length === 0 ? (
                  <p className="text-slate-400 italic">None (Root Gateway)</p>
                ) : (
                  <ul className="space-y-1">
                    {incomingCallers.map((caller) => (
                      <li
                        key={caller}
                        className="p-1.5 bg-slate-50 rounded font-mono text-[11px] text-slate-700 flex items-center space-x-1"
                      >
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                        <span>{caller}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Outgoing Dependencies ({outgoingTargets.length})</span>
                {outgoingTargets.length === 0 ? (
                  <p className="text-slate-400 italic">None (Leaf Component)</p>
                ) : (
                  <ul className="space-y-1">
                    {outgoingTargets.map((target) => (
                      <li
                        key={target}
                        className="p-1.5 bg-slate-50 rounded font-mono text-[11px] text-slate-700 flex items-center space-x-1"
                      >
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span>{target}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select any node on the left canvas to inspect properties, callers, and dependencies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
