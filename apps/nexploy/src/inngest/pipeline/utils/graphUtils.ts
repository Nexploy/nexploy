import { PipelineGraph, PipelineNode } from '@workspace/typescript-interface/pipeline/node';

export interface GraphAnalysis {
    sorted: PipelineNode[];
    reachableNodeIds: Set<string>;
}

export function analyzeGraph(graph: PipelineGraph): GraphAnalysis {
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    const directed = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));
    const reverse = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));
    const inDegree = new Map<string, number>(graph.nodes.map((n) => [n.id, 0]));

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

    const startNodeIds = new Set(
        graph.nodes.filter((n) => n.data.isStartNode === true).map((n) => n.id),
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

export function findRunningNodeId(graph: PipelineGraph, completedSet: Set<string>): string | null {
    const { sorted, reachableNodeIds } = analyzeGraph(graph);

    const deps = new Map<string, Set<string>>(graph.nodes.map((n) => [n.id, new Set()]));
    for (const edge of graph.edges) {
        deps.get(edge.target)?.add(edge.source);
    }

    for (const node of sorted) {
        if (!reachableNodeIds.has(node.id)) continue;
        if (completedSet.has(node.id)) continue;
        const nodeDeps = deps.get(node.id)!;
        if ([...nodeDeps].every((dep) => completedSet.has(dep) || !reachableNodeIds.has(dep))) {
            return node.id;
        }
    }

    return null;
}
