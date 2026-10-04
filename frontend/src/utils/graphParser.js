/**
 * graphParser.js
 * Converts a backend ReasoningMap JSON object into React Flow nodes and edges with Teal / Sea Green palette.
 */

export function parseReasoningMapToGraph(reasoningMap) {
  if (!reasoningMap) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  const { decision_summary, options = [], assumptions = [], stakeholders = [], timeframe } = reasoningMap;

  // 1. Root Decision Node
  const rootId = 'root-decision';
  const rootX = 400;
  const rootY = 40;

  nodes.push({
    id: rootId,
    type: 'decisionNode',
    position: { x: rootX, y: rootY },
    data: {
      label: decision_summary || 'Untitled Decision Dilemma',
      timeframe: timeframe,
      stakeholders: stakeholders,
    },
  });

  // 2. Option Nodes
  const optionSpacingX = 340;
  const numOptions = options.length;
  const startOptionX = rootX - ((numOptions - 1) * optionSpacingX) / 2;
  const optionY = rootY + 170;

  options.forEach((opt, optIdx) => {
    const optId = `opt-${optIdx}`;
    const optX = startOptionX + optIdx * optionSpacingX;

    nodes.push({
      id: optId,
      type: 'optionNode',
      position: { x: optX, y: optionY },
      data: {
        label: opt.name || `Option ${optIdx + 1}`,
      },
    });

    // Edge from Root -> Option (Teal / Sea Green)
    edges.push({
      id: `edge-root-${optId}`,
      source: rootId,
      target: optId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#0d9488', strokeWidth: 2.5 },
    });

    // 3. Reason Nodes under each option
    const reasons = opt.reasons || [];
    let currentReasonY = optionY + 120;

    reasons.forEach((reason, rIdx) => {
      const reasonId = `reason-${optIdx}-${rIdx}`;
      const reasonX = optX - 10 + (rIdx % 2 === 0 ? 0 : 20);

      nodes.push({
        id: reasonId,
        type: 'reasonNode',
        position: { x: reasonX, y: currentReasonY },
        data: {
          label: reason.text,
          reasonType: reason.type || 'fact',
          salience: reason.salience || 'loud',
        },
      });

      edges.push({
        id: `edge-${optId}-${reasonId}`,
        source: optId,
        target: reasonId,
        type: 'smoothstep',
        style: {
          stroke: reason.type === 'fact' ? '#10b981' : reason.type === 'feeling' ? '#f59e0b' : '#9333ea',
          strokeWidth: 1.8,
          strokeDasharray: reason.type === 'guess' ? '4,4' : undefined,
        },
      });

      currentReasonY += 115;
    });
  });

  // 4. Assumptions Nodes
  const assumptionStartY = rootY + 170;
  const assumptionX = rootX + ((numOptions * optionSpacingX) / 2) + 120;

  assumptions.forEach((assump, aIdx) => {
    const assumpId = `assump-${aIdx}`;
    const posX = (numOptions === 0) ? rootX : (aIdx % 2 === 0 ? assumptionX : -180);
    const posY = assumptionStartY + Math.floor(aIdx / 2) * 150;

    nodes.push({
      id: assumpId,
      type: 'assumptionNode',
      position: { x: posX, y: posY },
      data: {
        label: assump.statement,
        status: assump.status || 'unchecked',
        evidence: assump.evidence,
      },
    });

    edges.push({
      id: `edge-root-${assumpId}`,
      source: rootId,
      target: assumpId,
      type: 'default',
      style: {
        stroke: assump.status === 'checked' ? '#0d9488' : '#e11d48',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
    });
  });

  return { nodes, edges };
}
