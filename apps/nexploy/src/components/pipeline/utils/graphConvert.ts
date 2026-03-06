import { type Edge, type Node } from '@xyflow/react';
import { NodeType, PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/lib/pipeline/nodeRegistry';

export function graphToFlow(graph: PipelineGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graph.nodes.map((n) => ({
        id: n.id,
        type: 'pipeline-node',
        position: n.position,
        data: {
            label: n.data.label ?? n.data.type,
            nodeType: n.data.type,
            definition: getNodeDefinition(n.data.type)!,
            config: n.data.config,
            pipelineNodeType: n.data.type,
        },
    }));

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
            type: n.data.pipelineNodeType as NodeType,
            position: n.position,
            data: {
                type: n.data.pipelineNodeType as NodeType,
                config: (n.data.config as Record<string, unknown>) ?? {},
                label: n.data.label as string,
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
