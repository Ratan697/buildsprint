'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';
import { Server, Globe, Database, Share2, AlertTriangle, CheckCircle2, X, Info } from 'lucide-react';

interface NodeCustomData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  impacted?: boolean;
  isSource?: boolean;
  criticality?: number;
  depth?: number;
  riskContribution?: number;
}

const CustomNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeCustomData;
  const nodeType = nodeData.nodeType || 'service';
  const isImpacted = Boolean(nodeData.impacted);
  const isSource = Boolean(nodeData.isSource);
  const criticality = nodeData.criticality ?? 1.0;
  const isHighRisk = isImpacted && (criticality >= 4.0 || isSource);

  const getTypeStyle = () => {
    switch (nodeType.toLowerCase()) {
      case 'database':
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Database',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'gateway':
      case 'api':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-sky-600" />,
          label: 'Gateway/API',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'external':
        return {
          icon: <Share2 className="w-3.5 h-3.5 text-purple-600" />,
          label: 'External',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'backend':
      case 'service':
      default:
        return {
          icon: <Server className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Backend Service',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
  };

  const config = getTypeStyle();

  let containerBorder = 'border-gray-200 bg-white text-slate-900';
  if (isSource) {
    containerBorder = 'border-red-500 bg-red-50/70 text-slate-900 ring-2 ring-red-500/30';
  } else if (isHighRisk) {
    containerBorder = 'border-red-400 bg-red-50/40 text-slate-900';
  } else if (isImpacted) {
    containerBorder = 'border-amber-400 bg-amber-50/40 text-slate-900';
  }

  return (
    <div
      tabIndex={0}
      aria-label={`Node ${nodeData.label}`}
      className={`px-3.5 py-2.5 rounded-lg border shadow-2xs min-w-[170px] transition-all duration-200 cursor-pointer ${containerBorder} ${
        selected ? 'border-slate-800 shadow-md scale-102' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400 border border-white" />

      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.badgeBg}`}
        >
          {config.icon}
          {config.label}
        </span>

        {isSource && (
          <span title="Origin of change" className="flex items-center text-red-600 text-[10px] font-semibold">
            ORIGIN
          </span>
        )}
        {isImpacted && !isSource && (
          <span title="Impacted by change" className="flex items-center text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="font-semibold text-xs text-slate-900 truncate">{nodeData.label}</div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400 border border-white" />
    </div>
  );
};

export default function DependencyGraph() {
  const { graphData, analysisResult, selectedNode, setSelectedNode, isLoading } = useChangeShieldStore();

  const { initialFlowNodes, initialFlowEdges } = useMemo(() => {
    const rawServices = graphData?.services || graphData?.nodes || [];
    const rawEdges = graphData?.edges || [];
    const blastReport = analysisResult?.blast_radius_analysis;

    const startNode = blastReport?.start_node;
    const impactedNodes = new Set(blastReport?.impacted_nodes || []);

    const layoutCoords: Record<string, { x: number; y: number }> = {
      'db-users': { x: 250, y: 320 },
      'user-service': { x: 250, y: 200 },
      'auth-service': { x: 250, y: 80 },
      'api-gateway': { x: 250, y: -40 },
    };

    const flowNodes = rawServices.map((srv, index) => {
      const isSource = startNode === srv.id;
      const isImpacted = isSource || impactedNodes.has(srv.id);
      const pos = layoutCoords[srv.id] || { x: 100 + (index % 3) * 200, y: 50 + Math.floor(index / 3) * 120 };

      const detail = blastReport?.node_details?.[srv.id];

      return {
        id: srv.id,
        type: 'customNode',
        position: pos,
        data: {
          label: srv.id,
          nodeType: String(srv.type || 'service'),
          impacted: isImpacted,
          isSource: isSource,
          criticality: typeof srv.criticality === 'number' ? srv.criticality : 1.0,
          depth: detail?.depth,
          riskContribution: detail?.risk_contribution,
        },
      };
    });

    const flowEdges = rawEdges.map((e, index) => {
      const isSourceImpacted = startNode === e.source || impactedNodes.has(e.source);
      const isTargetImpacted = startNode === e.target || impactedNodes.has(e.target);
      const isEdgeImpacted = isSourceImpacted && isTargetImpacted;

      return {
        id: `e-${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        animated: isEdgeImpacted,
        style: {
          stroke: isEdgeImpacted ? '#f59e0b' : '#cbd5e1',
          strokeWidth: isEdgeImpacted ? 2 : 1.5,
        },
      };
    });

    return { initialFlowNodes: flowNodes, initialFlowEdges: flowEdges };
  }, [graphData, analysisResult]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  React.useEffect(() => {
    setNodes(initialFlowNodes);
    setEdges(initialFlowEdges);
  }, [initialFlowNodes, initialFlowEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ customNode: CustomNodeComponent }), []);

  const selectedNodeObj = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode)?.data as NodeCustomData | undefined;
  }, [selectedNode, nodes]);

  if (isLoading) {
    return (
      <div className="w-full h-[520px] bg-[#fcfcfd] border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-900">Calculating system blast radius...</span>
        <span className="text-[11px] text-gray-500">Traversing dependency graph & risk criticality</span>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-[520px] bg-[#fcfcfd] border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2">
        <Info className="w-6 h-6 text-gray-400" />
        <span className="text-sm font-semibold text-slate-900">No Graph Data Available</span>
        <span className="text-xs text-gray-500">Upload schema or connect system source to view dependency graph.</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] bg-[#fcfcfd] border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {/* Visual Legend Header */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-xs border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-3 text-[11px] text-gray-600 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Change Origin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Impacted Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span>Neutral</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
        <Controls className="!bg-white !border-gray-200 !shadow-xs !rounded-md" />
      </ReactFlow>

      {/* Selected Node Inspector Drawer */}
      {selectedNodeObj && (
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-4 w-64 shadow-md z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-semibold text-slate-900">Component Inspection</span>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-slate-900 rounded p-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Service ID:</span>
              <span className="font-semibold text-slate-900 truncate">{selectedNodeObj.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Component Type:</span>
              <span className="capitalize font-mono text-slate-800">{selectedNodeObj.nodeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Criticality:</span>
              <span className="font-mono text-slate-800">{selectedNodeObj.criticality ?? 1.0}</span>
            </div>

            {selectedNodeObj.depth !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Impact Depth:</span>
                <span className="font-mono text-slate-800">{selectedNodeObj.depth}</span>
              </div>
            )}

            {selectedNodeObj.riskContribution !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Contribution:</span>
                <span className="font-mono text-slate-800">{selectedNodeObj.riskContribution}</span>
              </div>
            )}

            <div className="flex justify-between pt-1 border-t border-gray-100">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                {selectedNodeObj.isSource ? (
                  <span className="text-red-600 font-semibold">Origin of Change</span>
                ) : selectedNodeObj.impacted ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Impacted
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unaffected
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
