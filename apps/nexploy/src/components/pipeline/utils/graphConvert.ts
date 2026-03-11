import { type Edge, type Node } from '@xyflow/react';
import { NodeId, PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';

export function graphToFlow(graph: PipelineGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graph.nodes.map((n) => {
        const def = getNodeDefinition(n.data.type);
        const rfType = def?.variant === 'card' ? 'attach-node' : 'base-node';
        return {
            id: n.id,
            type: rfType,
            position: n.position,
            data: {
                label: n.data.label ?? n.data.type,
                nodeType: n.data.type,
                definition: def!,
                config: n.data.config,
                disabled: n.data.disabled ?? false,
                isStartNode: n.data.isStartNode ?? false,
            },
        };
    });

    const edges: Edge[] = graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
        type: 'gradient-edge',
        animated: false,
    }));

    return { nodes, edges };
}

export function flowToGraph(nodes: Node[], edges: Edge[]): PipelineGraph {
    return {
        nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data.nodeType as NodeId,
            position: n.position,
            data: {
                type: n.data.nodeType as NodeId,
                config: (n.data.config as Record<string, unknown>) ?? {},
                label: n.data.label as string,
                disabled: (n.data.disabled as boolean) ?? false,
                isStartNode: (n.data.isStartNode as boolean) ?? false,
            },
        })),
        edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            sourceHandle: e.sourceHandle ?? undefined,
            target: e.target,
            targetHandle: e.targetHandle ?? undefined,
        })),
    };
}
