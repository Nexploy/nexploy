import { Edge, Node } from '@xyflow/react';
import { NodeId, PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';

export function graphToFlow(graph: PipelineGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graph.nodes.map((node) => {
        const def = getNodeDefinition(node.data.type);
        return {
            id: node.id,
            type: def?.type,
            position: node.position,
            data: {
                nodeType: node.data.type,
                definition: def!,
                config: node.data.config,
                disabled: node.data.disabled ?? false,
                isStartNode: node.data.isStartNode ?? false,
                isEndNode: node.data.isEndNode ?? false,
            },
        };
    });

    const edges: Edge[] = graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
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
                disabled: (n.data.disabled as boolean) ?? false,
                isStartNode: (n.data.isStartNode as boolean) ?? false,
                isEndNode: (n.data.isEndNode as boolean) ?? false,
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
