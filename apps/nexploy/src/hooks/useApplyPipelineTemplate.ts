import { useCallback } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { NodeId } from '@nexploy/nodes/core/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigDefaults } from '@/components/pipeline/nodeManifestRegistry';
import { usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { PipelineTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';
import { computeGraphLayout, H_GAP } from '@/components/pipeline/utils/graphLayout';
import { FIT_VIEW_OPTIONS } from '@/components/pipeline/utils/fitViewOptions';

const FALLBACK_NODE_WIDTH = 240;
const MAX_LAYOUT_FRAMES = 30;

function buildTemplateGraph(template: PipelineTemplate, origin: { x: number; y: number }) {
    const ts = Date.now();

    const nodes: Node[] = template.nodes.map((tn, i) => {
        const def = getNodeDefinition(tn.type as NodeId);
        return {
            id: `${tn.type}-${ts}-${i}`,
            type: def?.type,
            position: { x: origin.x + i * (FALLBACK_NODE_WIDTH + H_GAP), y: origin.y },
            data: {
                label: tn.type,
                nodeType: tn.type,
                definition: def,
                config: {
                    ...getConfigDefaults(tn.type),
                    ...(tn.config ?? {}),
                },
                isStartNode: def?.isStartNode ?? false,
                isEndNode: def?.isEndNode ?? false,
            },
        };
    });

    const edges: Edge[] = template.edges.map((te) => ({
        id: `e-${nodes[te.sourceIndex]!.id}-${nodes[te.targetIndex]!.id}`,
        source: nodes[te.sourceIndex]!.id,
        target: nodes[te.targetIndex]!.id,
        sourceHandle: te.sourceHandle,
        targetHandle: te.targetHandle,
        type: 'gradient-edge',
    }));

    return { nodes, edges };
}

export function useApplyPipelineTemplate() {
    const { getNodes, getEdges, fitView } = useReactFlow();
    const { setNodes, setEdges, triggerAutoSave } = usePipelineActions();

    return useCallback(
        (template: PipelineTemplate, origin: { x: number; y: number }) => {
            const { nodes, edges } = buildTemplateGraph(template, origin);
            const ids = new Set(nodes.map((n) => n.id));

            setNodes(() => nodes);
            setEdges(() => edges);

            let frames = 0;
            const layoutWhenMeasured = () => {
                const current = getNodes().filter((n) => ids.has(n.id));
                const measured = current.length === nodes.length && current.every((n) => n.measured?.width);

                if (!measured && frames++ < MAX_LAYOUT_FRAMES) {
                    requestAnimationFrame(layoutWhenMeasured);
                    return;
                }

                const positionMap = computeGraphLayout(current, getEdges());
                setNodes((existing) =>
                    existing.map((node) => {
                        const pos = positionMap.get(node.id);
                        return pos ? { ...node, position: { x: origin.x + pos.x, y: origin.y + pos.y } } : node;
                    }),
                );

                triggerAutoSave();
                requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
            };

            requestAnimationFrame(layoutWhenMeasured);
        },
        [getNodes, getEdges, setNodes, setEdges, triggerAutoSave, fitView],
    );
}
