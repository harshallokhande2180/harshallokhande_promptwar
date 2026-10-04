import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes/CustomNodes';
import { parseReasoningMapToGraph } from '../utils/graphParser';
import { Network, Layers, ShieldCheck } from 'lucide-react';

export default function GraphCanvas({ reasoningMap, isReflected }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (reasoningMap) {
      const { nodes: newNodes, edges: newEdges } = parseReasoningMapToGraph(reasoningMap);
      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [reasoningMap, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full bg-[#eef1f4] overflow-hidden flex flex-col">
      {/* Top Floating Info Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-300 text-xs font-semibold text-slate-700 backdrop-blur-md flex items-center gap-2 shadow-sm">
          <Network className="w-3.5 h-3.5 text-teal-600" />
          <span>Interactive Reasoning Graph</span>
          {isReflected && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-300">
              <ShieldCheck className="w-3 h-3 text-teal-600" /> Calibrated
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-300 text-[11px] backdrop-blur-md text-slate-600 font-medium shadow-sm">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Fact</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Feeling</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Guess</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Unchecked</span>
      </div>

      {nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-teal-600 mb-4 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Canvas is Waiting for Dilemma</h3>
          <p className="text-xs max-w-sm text-slate-500">
            Enter your decision context in the panel and click "Analyze Thinking" to decompose your dilemma into an interactive node graph.
          </p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          className="bg-transparent"
        >
          <Background color="#cbd5e1" gap={20} size={1.2} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-white !border-slate-300 !text-slate-700 !fill-slate-700 shadow-md" />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'decisionNode') return '#0d9488';
              if (node.type === 'optionNode') return '#14b8a6';
              if (node.type === 'assumptionNode') return node.data?.status === 'checked' ? '#0d9488' : '#f43f5e';
              return '#10b981';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
            className="!bg-white !border-slate-300 rounded-xl shadow-md"
          />
        </ReactFlow>
      )}
    </div>
  );
}
