import { PipelineEdge, PipelineNode } from '@workspace/typescript-interface/pipeline/node';

export function topologicalSort(nodes: PipelineNode[], edges: PipelineEdge[]): PipelineNode[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
    const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

    for (const edge of edges) {
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
        if (degree === 0) queue.push(id);
    }

    const sorted: PipelineNode[] = [];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const node = nodeMap.get(nodeId);
        if (node) sorted.push(node);

        for (const neighbor of adjacency.get(nodeId) ?? []) {
            const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) queue.push(neighbor);
        }
    }

    if (sorted.length !== nodes.length) {
        throw new Error('Pipeline contains a cycle');
    }

    return sorted;
}
