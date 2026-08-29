'use client';

import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Server, Globe, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type?: 'service' | 'database' | 'api' | string;
  impacted?: boolean;
  riskScore?: number; // 0 to 100 or 0 to 1
  impactLevel?: 'high' | 'medium' | 'low' | 'none';
}

export type DependencyNode = Node<CustomNodeData>;
export type DependencyEdge = Edge<{
  impacted?: boolean;
  riskScore?: number;
  [key: string]: unknown;
}>;

interface DependencyGraphProps {
  initialNodes?: DependencyNode[];
  initialEdges?: DependencyEdge[];
  nodes?: DependencyNode[];
  edges?: DependencyEdge[];
  onNodeClick?: (event: React.MouseEvent, node: DependencyNode) => void;
}

const CustomGraphNode: React.FC<NodeProps<DependencyNode>> = ({ data, selected }) => {
  const nodeType = data.type || 'service';
  const impacted = Boolean(data.impacted);
  const riskScore = data.riskScore ?? 0;
  
  // Determine risk level (accepts either 0-1 or 0-100 scales)
  const normalizedRisk = riskScore > 1 ? riskScore / 100 : riskScore;
  const isHighRisk = impacted && (normalizedRisk >= 0.7 || data.impactLevel === 'high');
  const isMediumRisk = impacted && (normalizedRisk < 0.7 || data.impactLevel === 'medium');

  // Node type visual configuration
  const getTypeBadge = () => {
    switch (nodeType) {
      case 'database':
        return {
          icon: <Database className="w-4 h-4 text-emerald-400" />,
          label: 'Database',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-950/20',
        };
      case 'api':
        return {
          icon: <Globe className="w-4 h-4 text-sky-400" />,
          label: 'API Gateway',
          border: 'border-sky-500/30',
          bg: 'bg-sky-950/20',
        };
      case 'service':
      default:
        return {
          icon: <Server className="w-4 h-4 text-indigo-400" />,
          label: 'Microservice',
          border: 'border-indigo-500/30',
          bg: 'bg-indigo-950/20',
        };
    }
  };

  const typeConfig = getTypeBadge();

  // Highlight styling based on simulation risk impact
  let impactStyle = 'border-slate-800 bg-slate-900 text-slate-200 shadow-md';
  if (isHighRisk) {
    impactStyle = 'border-red-500 bg-red-950/80 text-red-100 shadow-lg shadow-red-500/20 animate-pulse';
  } else if (isMediumRisk) {
    impactStyle = 'border-amber-500 bg-amber-950/80 text-amber-100 shadow-lg shadow-amber-500/20';
  }

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-300 ${impactStyle} ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-400 border-2 border-slate-900" />
      
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.border} ${typeConfig.bg}`}>
          {typeConfig.icon}
          <span className="capitalize">{typeConfig.label}</span>
        </div>

        {isHighRisk && (
          <span title="High Risk Impact" className="flex items-center text-red-400">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
          </span>
        )}
        {isMediumRisk && (
          <span title="Warning Risk Impact" className="flex items-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="font-semibold text-sm truncate">{data.label}</div>

      {impacted && (
        <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-700/50 pt-1.5">
          <span className="text-slate-400">Impact Risk:</span>
          <span className={`font-mono font-bold ${isHighRisk ? 'text-red-400' : 'text-amber-400'}`}>
            {Math.round(normalizedRisk * 100)}%
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-400 border-2 border-slate-900" />
    </div>
  );
};

const defaultNodes: DependencyNode[] = [
  {
    id: 'api-1',
    type: 'custom',
    position: { x: 250, y: 0 },
    data: { label: 'API Gateway', type: 'api' },
  },
  {
    id: 'auth-service',
    type: 'custom',
    position: { x: 100, y: 120 },
    data: { label: 'Auth Service', type: 'service' },
  },
  {
    id: 'order-service',
    type: 'custom',
    position: { x: 400, y: 120 },
    data: { label: 'Order Service', type: 'service' },
  },
  {
    id: 'db-main',
    type: 'custom',
    position: { x: 250, y: 260 },
    data: { label: 'User & Order DB', type: 'database' },
  },
];

const defaultEdges: DependencyEdge[] = [
  { id: 'e1-2', source: 'api-1', target: 'auth-service' },
  { id: 'e1-3', source: 'api-1', target: 'order-service' },
  { id: 'e2-4', source: 'auth-service', target: 'db-main' },
  { id: 'e3-4', source: 'order-service', target: 'db-main' },
];

export default function DependencyGraph({
  nodes: controlledNodes,
  edges: controlledEdges,
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  onNodeClick,
}: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DependencyNode>(controlledNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DependencyEdge>(controlledEdges || initialEdges);

  useEffect(() => {
    if (controlledNodes) {
      setNodes(controlledNodes);
    }
  }, [controlledNodes, setNodes]);

  useEffect(() => {
    if (controlledEdges) {
      setEdges(controlledEdges);
    }
  }, [controlledEdges, setEdges]);

  const nodeTypes = useMemo(
    () => ({
      custom: CustomGraphNode,
    }),
    []
  );

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isImpacted = Boolean(edge.data?.impacted);
      const riskScore = edge.data?.riskScore ?? 0;
      const normalizedRisk = riskScore > 1 ? riskScore / 100 : riskScore;
      const isHighRisk = isImpacted && (normalizedRisk >= 0.7);

      if (isHighRisk) {
        return {
          ...edge,
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 3 },
        };
      }
      if (isImpacted) {
        return {
          ...edge,
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2.5 },
        };
      }
      return {
        ...edge,
        style: { stroke: '#475569', strokeWidth: 1.5 },
      };
    });
  }, [edges]);

  return (
    <div className="w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 fill-slate-200" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as CustomNodeData;
            if (data?.impacted) {
              const risk = (data.riskScore ?? 0) > 1 ? (data.riskScore ?? 0) / 100 : (data.riskScore ?? 0);
              return risk >= 0.7 ? '#ef4444' : '#f59e0b';
            }
            switch (data?.type) {
              case 'database':
                return '#10b981';
              case 'api':
                return '#0284c7';
              default:
                return '#6366f1';
            }
          }}
          className="!bg-slate-900 !border-slate-800"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
