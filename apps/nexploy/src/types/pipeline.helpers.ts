import { PipelineEdge } from '@workspace/typescript-interface/pipeline/node';
import { NodeOutputData, NodeOutputStore } from './pipeline.type';

export function getFromInputs<T>(inputOutputs: NodeOutputData[], key: string): T | undefined {
    for (const output of inputOutputs) {
        if (key in output) return output[key] as T;
    }
    return undefined;
}

export function getFromAllOutputs<T>(allOutputs: NodeOutputStore, key: string): T | undefined {
    for (const output of allOutputs.values()) {
        if (key in output) return output[key] as T;
    }
    return undefined;
}

export function getFromClosestAncestor<T>(
    allOutputs: NodeOutputStore,
    edges: PipelineEdge[],
    nodeId: string,
    key: string,
): T | undefined {
    const visited = new Set<string>();
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const parents = edges.filter((e) => e.target === current).map((e) => e.source);
        for (const parentId of parents) {
            const output = allOutputs.get(parentId);
            if (output && key in output) return output[key] as T;
            queue.push(parentId);
        }
    }

    return undefined;
}
