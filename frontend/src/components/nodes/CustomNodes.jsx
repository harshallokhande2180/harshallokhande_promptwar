import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  GitBranch, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Volume2,
  VolumeX
} from 'lucide-react';

export const DecisionNode = memo(({ data }) => {
  return (
    <div className="min-w-[280px] max-w-[340px] rounded-2xl bg-gradient-to-b from-teal-50 to-white border-2 border-teal-500/80 p-4 shadow-xl shadow-teal-600/10 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-teal-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-700">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Core Dilemma</span>
        </div>
        {data.timeframe && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono font-medium">
            {data.timeframe}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        {data.label}
      </p>
      {data.stakeholders && data.stakeholders.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
          <span className="text-[10px] text-slate-500 mr-1 self-center">Stakeholders:</span>
          {data.stakeholders.map((s, idx) => (
            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              {s}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-teal-600 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

export const OptionNode = memo(({ data }) => {
  return (
    <div className="min-w-[240px] max-w-[280px] rounded-xl bg-white border border-slate-300 p-3.5 shadow-lg shadow-slate-200/60 backdrop-blur-md hover:border-teal-500 transition-colors">
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1 rounded-md bg-teal-500/15 text-teal-700">
          <GitBranch className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Option Branch</span>
      </div>
      <p className="text-sm font-bold text-slate-800">
        {data.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-teal-600 !w-2.5 !h-2.5 !border-2 !border-white" />
    </div>
  );
});

export const ReasonNode = memo(({ data }) => {
  const typeStyles = {
    fact: {
      bg: 'from-emerald-50 to-white',
      border: 'border-emerald-400 hover:border-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      text: 'text-emerald-900',
      tag: 'Fact',
    },
    feeling: {
      bg: 'from-amber-50 to-white',
      border: 'border-amber-300 hover:border-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      text: 'text-amber-900',
      tag: 'Feeling',
    },
    guess: {
      bg: 'from-purple-50 to-white',
      border: 'border-purple-300 hover:border-purple-500',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      text: 'text-purple-900',
      tag: 'Guess',
    },
  };

  const style = typeStyles[data.reasonType] || typeStyles.fact;

  return (
    <div className={`min-w-[200px] max-w-[240px] rounded-xl bg-gradient-to-b ${style.bg} border ${style.border} p-3 shadow-md backdrop-blur-md transition-all`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border !border-white" />
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
          {style.tag}
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          {data.salience === 'loud' ? (
            <span className="flex items-center gap-0.5 text-rose-700 font-semibold bg-rose-100 px-1.5 py-0.5 rounded">
              <Volume2 className="w-2.5 h-2.5" /> Loud
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
              <VolumeX className="w-2.5 h-2.5" /> Quiet
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed font-medium">
        {data.label}
      </p>
    </div>
  );
});

export const AssumptionNode = memo(({ data }) => {
  const isChecked = data.status === 'checked';
  const isUnverifiable = data.status === 'unverifiable';

  return (
    <div className={`min-w-[240px] max-w-[290px] rounded-xl border p-3 shadow-md backdrop-blur-md transition-all ${
      isChecked 
        ? 'bg-gradient-to-b from-teal-50 to-white border-teal-500 shadow-teal-500/10' 
        : isUnverifiable
        ? 'bg-slate-50 border-slate-300'
        : 'bg-gradient-to-b from-rose-50 to-white border-rose-400 shadow-rose-500/10'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border !border-white" />
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-[10px] font-bold text-slate-600 uppercase">Assumption</span>
        </div>
        {isChecked ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Checked
          </span>
        ) : isUnverifiable ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
            Unverifiable
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Unchecked
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-800 leading-snug">
        {data.label}
      </p>
      {data.evidence && (
        <div className="mt-2 pt-2 border-t border-teal-200">
          <p className="text-[11px] text-teal-900 italic bg-teal-50/80 p-1.5 rounded-md border border-teal-200 font-medium">
            ✓ {data.evidence}
          </p>
        </div>
      )}
    </div>
  );
});

export const nodeTypes = {
  decisionNode: DecisionNode,
  optionNode: OptionNode,
  reasonNode: ReasonNode,
  assumptionNode: AssumptionNode,
};
