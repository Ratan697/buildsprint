'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Layers,
  Database,
  Server,
  Globe,
  Network,
  Search,
  Filter,
  Play,
  ArrowRight,
  ShieldAlert,
  Zap,
  X,
  Sparkles,
  GitFork,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export type ComponentType = 'database' | 'service' | 'gateway' | 'external';

export interface TopologyNodeData extends Record<string, unknown> {
  label: string;
  componentType: ComponentType;
  criticality: number;
  repoUrl?: string;
  impacted?: boolean;
  isSource?: boolean;
  incomingCallers: string[];
  outgoingDependencies: string[];
}

export interface CustomTopologyNode {
  id: string;
  type: 'customNode';
  position: { x: number; y: number };
  data: TopologyNodeData;
}

export interface CustomTopologyEdge {
  id: string;
  source: string;
  target: string;
  relation?: string;
  impacted?: boolean;
}

const INITIAL_TOPOLOGY_NODES: CustomTopologyNode[] = [
  {
    id: 'api-gateway',
    type: 'customNode',
    position: { x: 350, y: 0 },
    data: {
      label: 'API Gateway & Ingress',
      componentType: 'gateway',
      criticality: 4.0,
      repoUrl: 'https://github.com/org/api-gateway',
      incomingCallers: ['External Clients / Web'],
      outgoingDependencies: ['auth-service', 'user-service', 'order-service', 'catalog-service'],
    },
  },
  {
    id: 'auth-service',
    type: 'customNode',
    position: { x: 150, y: 140 },
    data: {
      label: 'Auth & Identity Service',
      componentType: 'service',
      criticality: 5.0,
      repoUrl: 'https://github.com/org/auth-service',
      incomingCallers: ['api-gateway'],
      outgoingDependencies: ['user-service', 'db-users'],
    },
  },
  {
    id: 'user-service',
    type: 'customNode',
    position: { x: 400, y: 140 },
    data: {
      label: 'User Profile Service',
      componentType: 'service',
      criticality: 4.8,
      repoUrl: 'https://github.com/org/user-service',
      incomingCallers: ['api-gateway', 'auth-service'],
      outgoingDependencies: ['db-users'],
    },
  },
  {
    id: 'order-service',
    type: 'customNode',
    position: { x: 650, y: 140 },
    data: {
      label: 'Order Processing Service',
      componentType: 'service',
      criticality: 4.2,
      repoUrl: 'https://github.com/org/order-service',
      incomingCallers: ['api-gateway'],
      outgoingDependencies: ['payment-service', 'db-orders', 'notification-service'],
    },
  },
  {
    id: 'catalog-service',
    type: 'customNode',
    position: { x: 900, y: 140 },
    data: {
      label: 'Catalog & Inventory Service',
      componentType: 'service',
      criticality: 3.8,
      repoUrl: 'https://github.com/org/catalog-service',
      incomingCallers: ['api-gateway', 'order-service'],
      outgoingDependencies: ['db-orders'],
    },
  },
  {
    id: 'payment-service',
    type: 'customNode',
    position: { x: 500, y: 300 },
    data: {
      label: 'Payment Engine Service',
      componentType: 'service',
      criticality: 5.0,
      repoUrl: 'https://github.com/org/payment-service',
      incomingCallers: ['order-service'],
      outgoingDependencies: ['db-users', 'stripe-gateway'],
    },
  },
  {
    id: 'notification-service',
    type: 'customNode',
    position: { x: 750, y: 300 },
    data: {
      label: 'Notification Worker',
      componentType: 'service',
      criticality: 3.5,
      repoUrl: 'https://github.com/org/notification-service',
      incomingCallers: ['order-service'],
      outgoingDependencies: [],
    },
  },
  {
    id: 'db-users',
    type: 'customNode',
    position: { x: 250, y: 440 },
    data: {
      label: 'User Accounts DB (PostgreSQL)',
      componentType: 'database',
      criticality: 5.0,
      repoUrl: 'https://github.com/org/user-db-migrations',
      incomingCallers: ['auth-service', 'user-service', 'payment-service'],
      outgoingDependencies: [],
    },
  },
  {
    id: 'db-orders',
    type: 'customNode',
    position: { x: 650, y: 440 },
    data: {
      label: 'Orders DB (PostgreSQL)',
      componentType: 'database',
      criticality: 5.0,
      repoUrl: 'https://github.com/org/order-db-migrations',
      incomingCallers: ['order-service', 'catalog-service'],
      outgoingDependencies: [],
    },
  },
  {
    id: 'stripe-gateway',
    type: 'customNode',
    position: { x: 450, y: 580 },
    data: {
      label: 'Stripe Settlement API',
      componentType: 'external',
      criticality: 4.0,
      repoUrl: 'https://stripe.com/docs/api',
      incomingCallers: ['payment-service'],
      outgoingDependencies: [],
    },
  },
];

const INITIAL_TOPOLOGY_EDGES: CustomTopologyEdge[] = [
  { id: 'e-gw-auth', source: 'api-gateway', target: 'auth-service', relation: 'calls' },
  { id: 'e-gw-user', source: 'api-gateway', target: 'user-service', relation: 'calls' },
  { id: 'e-gw-order', source: 'api-gateway', target: 'order-service', relation: 'calls' },
  { id: 'e-gw-cat', source: 'api-gateway', target: 'catalog-service', relation: 'calls' },
  { id: 'e-auth-user', source: 'auth-service', target: 'user-service', relation: 'depends_on' },
  { id: 'e-auth-dbu', source: 'auth-service', target: 'db-users', relation: 'reads/writes' },
  { id: 'e-user-dbu', source: 'user-service', target: 'db-users', relation: 'reads/writes' },
  { id: 'e-order-pay', source: 'order-service', target: 'payment-service', relation: 'calls' },
  { id: 'e-order-dbo', source: 'order-service', target: 'db-orders', relation: 'reads/writes' },
  { id: 'e-order-notify', source: 'order-service', target: 'notification-service', relation: 'dispatches' },
  { id: 'e-cat-dbo', source: 'catalog-service', target: 'db-orders', relation: 'reads' },
  { id: 'e-pay-dbu', source: 'payment-service', target: 'db-users', relation: 'reads' },
  { id: 'e-pay-stripe', source: 'payment-service', target: 'stripe-gateway', relation: 'external_call' },
];

const CustomTopologyNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as TopologyNodeData;
  const type = nodeData.componentType || 'service';
  const isImpacted = Boolean(nodeData.impacted);
  const isSource = Boolean(nodeData.isSource);

  const getTypeConfig = () => {
    switch (type) {
      case 'database':
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Database',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'gateway':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-sky-600" />,
          label: 'Gateway',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'external':
        return {
          icon: <Network className="w-3.5 h-3.5 text-purple-600" />,
          label: 'External',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'service':
      default:
        return {
          icon: <Server className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Service',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
  };

  const config = getTypeConfig();

  let containerBorder = 'border-gray-200 bg-white text-slate-900 shadow-2xs';
  if (isSource) {
    containerBorder = 'border-rose-500 bg-rose-50/70 text-slate-900 ring-2 ring-rose-500/30 shadow-md';
  } else if (isImpacted) {
    containerBorder = 'border-amber-400 bg-amber-50/50 text-slate-900 shadow-sm';
  }

  return (
    <div
      tabIndex={0}
      aria-label={`Topology node ${nodeData.label}`}
      className={`px-4 py-3 rounded-xl border min-w-[200px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900 ${containerBorder} ${
        selected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-gray-400 border border-white" />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.badgeBg}`}
        >
          {config.icon}
          {config.label}
        </span>

        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-slate-700 border border-gray-200">
          Crit {nodeData.criticality}
        </span>
      </div>

      <div className="font-semibold text-xs text-slate-900 truncate">{nodeData.label}</div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-gray-400 border border-white" />
    </div>
  );
};

export default function DependenciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | ComponentType>('All');
  const [traceSourceId, setTraceSourceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Trace Impact Traversal helper
  const impactedNodeIds = useMemo(() => {
    if (!traceSourceId) return new Set<string>();

    const set = new Set<string>([traceSourceId]);
    const queue = [traceSourceId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      INITIAL_TOPOLOGY_EDGES.forEach((edge) => {
        if (edge.source === current && !set.has(edge.target)) {
          set.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    return set;
  }, [traceSourceId]);

  // Compute Nodes for ReactFlow
  const flowNodes = useMemo(() => {
    return INITIAL_TOPOLOGY_NODES.map((node) => {
      const matchesSearch =
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'All' || node.data.componentType === selectedType;

      const isSource = traceSourceId === node.id;
      const isImpacted = impactedNodeIds.has(node.id);

      return {
        ...node,
        hidden: !(matchesSearch && matchesType),
        data: {
          ...node.data,
          impacted: isImpacted,
          isSource: isSource,
        },
      };
    });
  }, [searchQuery, selectedType, traceSourceId, impactedNodeIds]);

  // Compute Edges for ReactFlow
  const flowEdges = useMemo(() => {
    return INITIAL_TOPOLOGY_EDGES.map((edge) => {
      const isSourceImpacted = impactedNodeIds.has(edge.source);
      const isTargetImpacted = impactedNodeIds.has(edge.target);
      const isImpactedEdge = isSourceImpacted && isTargetImpacted;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: 500 },
        animated: isImpactedEdge,
        markerEnd: { type: MarkerType.ArrowClosed, color: isImpactedEdge ? '#f59e0b' : '#94a3b8' },
        style: {
          stroke: isImpactedEdge ? '#f59e0b' : '#cbd5e1',
          strokeWidth: isImpactedEdge ? 2.5 : 1.5,
        },
      };
    });
  }, [impactedNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Synchronize state when filters / trace selections change
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const nodeTypes = useMemo(() => ({ customNode: CustomTopologyNodeComponent }), []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNodeObj = useMemo(() => {
    if (!selectedNodeId) return null;
    return INITIAL_TOPOLOGY_NODES.find((n) => n.id === selectedNodeId)?.data;
  }, [selectedNodeId]);

  const handleStartTrace = (id: string) => {
    setTraceSourceId(id);
    triggerToast(`Tracing blast radius path traversal from node "${id}"...`);
  };

  const handleResetTrace = () => {
    setTraceSourceId(null);
    triggerToast('Cleared blast radius path trace.');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-slate-900" />
            Architecture Topology & Dependency Explorer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Service call graphs, database mappings, and live blast radius path traversals.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {traceSourceId && (
            <button
              type="button"
              onClick={handleResetTrace}
              className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Path Trace</span>
            </button>
          )}

          <Link
            href="/simulations/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate Change</span>
          </Link>
        </div>
      </div>

      {/* Topology Scope Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Total Graph Nodes</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">10 Components</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Direct Relations</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">13 Edges</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Tier-1 Production DBs</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1">2 Databases</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-xs font-medium text-gray-500">Max Dependency Depth</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">4 Hops</span>
        </div>
      </div>

      {/* Controls Bar: Search & Component Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topology by component name or ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'All' | ComponentType)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="All">All Component Types</option>
            <option value="database">Databases</option>
            <option value="service">Backend Services</option>
            <option value="gateway">API Gateways</option>
            <option value="external">External APIs</option>
          </select>
        </div>
      </div>

      {/* Main Full-Screen Interactive React Flow Canvas */}
      <div className="relative w-full h-[620px] bg-[#fcfcfd] border border-gray-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
        {/* Canvas Visual Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-gray-200 rounded-lg p-3 flex flex-col gap-2 text-[11px] text-gray-600 shadow-sm pointer-events-none">
          <span className="font-semibold text-slate-900">Topology Legend</span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Trace Origin Target</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Impacted Downstream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Normal Component</span>
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
          <Controls className="!bg-white !border-gray-200 !shadow-xs !rounded-md" />
          <MiniMap className="!bg-white !border-gray-200 !rounded-lg" maskColor="rgba(241, 245, 249, 0.7)" />
        </ReactFlow>

        {/* Selected Component Inspector Side Panel Drawer */}
        {selectedNodeObj && selectedNodeId && (
          <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-xl p-5 w-80 shadow-xl z-20 flex flex-col gap-4 animate-in slide-in-from-right duration-150 max-h-[92%] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-gray-400">Node ID: {selectedNodeId}</span>
                <h3 className="text-sm font-bold text-slate-900">{selectedNodeObj.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-gray-400 hover:text-slate-900 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Component Properties */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Component Type:</span>
                <span className="capitalize font-medium text-slate-900">{selectedNodeObj.componentType}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Criticality Rating:</span>
                <span className="font-mono font-bold text-slate-900">{selectedNodeObj.criticality} / 5.0</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Repository:</span>
                <span className="font-mono text-[11px] text-indigo-600 truncate max-w-[150px]">
                  {selectedNodeObj.repoUrl}
                </span>
              </div>
            </div>

            {/* Upstream Callers */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 rotate-180" />
                Upstream Callers ({selectedNodeObj.incomingCallers.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedNodeObj.incomingCallers.map((caller) => (
                  <button
                    key={caller}
                    type="button"
                    onClick={() => setSelectedNodeId(caller)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-slate-800 font-mono text-[11px] rounded border border-gray-200 transition-colors cursor-pointer"
                  >
                    {caller}
                  </button>
                ))}
              </div>
            </div>

            {/* Downstream Dependencies */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                Downstream Dependencies ({selectedNodeObj.outgoingDependencies.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedNodeObj.outgoingDependencies.length === 0 ? (
                  <span className="text-gray-400 text-[11px] italic">Leaf component (no outgoing edges)</span>
                ) : (
                  selectedNodeObj.outgoingDependencies.map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setSelectedNodeId(target)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-slate-800 font-mono text-[11px] rounded border border-gray-200 transition-colors cursor-pointer"
                    >
                      {target}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons inside Drawer */}
            <div className="pt-2 flex flex-col gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleStartTrace(selectedNodeId)}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5 text-amber-700" />
                <span>Trace Blast Radius Path</span>
              </button>

              <Link
                href={`/simulations/new?target=${selectedNodeId}`}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Change on Component</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
