import {
    NodeData,
    PipelineGraph,
    PipelineNode,
} from '@workspace/typescript-interface/pipeline/node';
import { Edge, Node } from '@xyflow/react';

export interface GraphAnalysis {
    sorted: PipelineNode[];
    reachableNodeIds: Set<string>;
}

export function analyzeGraph(
    graph: PipelineGraph,
    triggerSource: 'manual' | 'webhook' = 'manual',
): GraphAnalysis {
    const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

    const directed = new Map<string, string[]>(graph.nodes.map((node) => [node.id, []]));
    const reverse = new Map<string, string[]>(graph.nodes.map((node) => [node.id, []]));
    const inDegree = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]));

    for (const edge of graph.edges) {
        directed.get(edge.source)?.push(edge.target);
        reverse.get(edge.target)?.push(edge.source);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    const topoQueue: string[] = [];
    for (const [id, deg] of inDegree) {
        if (deg === 0) topoQueue.push(id);
    }

    const sorted: PipelineNode[] = [];
    while (topoQueue.length > 0) {
        const id = topoQueue.shift()!;
        const node = nodeMap.get(id);
        if (node) sorted.push(node);
        for (const targetId of directed.get(id) ?? []) {
            const newDeg = (inDegree.get(targetId) ?? 1) - 1;
            inDegree.set(targetId, newDeg);
            if (newDeg === 0) topoQueue.push(targetId);
        }
    }

    if (sorted.length !== graph.nodes.length) {
        throw new Error('Pipeline contains a cycle');
    }

    const startNodeIds =
        triggerSource === 'webhook'
            ? new Set(
                  graph.nodes.filter((node) => node.data.type === 'webhook-clone').map((n) => n.id),
              )
            : new Set(
                  graph.nodes
                      .filter(
                          (node) =>
                              node.data.isStartNode === true && node.data.type !== 'webhook-clone',
                      )
                      .map((node) => node.id),
              );
    const reachableNodeIds = new Set<string>(startNodeIds);
    const bfsQueue = [...startNodeIds];

    while (bfsQueue.length > 0) {
        const id = bfsQueue.shift()!;
        const neighbors = [...(directed.get(id) ?? []), ...(reverse.get(id) ?? [])];
        for (const neighborId of neighbors) {
            if (!reachableNodeIds.has(neighborId)) {
                reachableNodeIds.add(neighborId);
                bfsQueue.push(neighborId);
            }
        }
    }

    return { sorted, reachableNodeIds };
}

function bfsAncestors(
    startNodeId: string,
    nodes: Node[],
    edges: Edge[],
): { node: Node; data: NodeData }[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const queue = [startNodeId];
    const result: { node: Node; data: NodeData }[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const edge of edges) {
            if (edge.target !== current) continue;
            const parent = nodeMap.get(edge.source);
            if (!parent) continue;
            const data = parent.data as unknown as NodeData;
            result.push({ node: parent, data });
            queue.push(edge.source);
        }
    }

    return result;
}

export function hasAncestor(
    startNodeId: string,
    nodes: Node[],
    edges: Edge[],
    predicate: (data: NodeData) => boolean,
): boolean {
    return bfsAncestors(startNodeId, nodes, edges).some(({ data }) => predicate(data));
}

export function findAncestor(
    startNodeId: string,
    nodes: Node[],
    edges: Edge[],
    predicate: (data: NodeData) => boolean,
): { node: Node; data: NodeData } | undefined {
    return bfsAncestors(startNodeId, nodes, edges).find(({ data }) => predicate(data));
}
