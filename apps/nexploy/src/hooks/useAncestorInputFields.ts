'use client';

import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { getNodeInputFields } from '@/components/pipeline/nodeManifestRegistry';
import { type NodeInputField } from '@/components/pipeline/types/nodeManifest';

export interface AncestorWithInputs {
    nodeId: string;
    nodeType: string;
    inputFields: NodeInputField[];
}

function getAncestorIds(nodeId: string, edges: { source: string; target: string }[]): string[] {
    const visited = new Set<string>();
    const queue = [nodeId];
    const ancestors: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const parents = edges.filter((e) => e.target === current).map((e) => e.source);
        for (const parentId of parents) {
            if (!visited.has(parentId)) {
                ancestors.push(parentId);
                queue.push(parentId);
            }
        }
    }

    return ancestors;
}

export function useAncestorInputFields(nodeId: string): AncestorWithInputs[] {
    const { getNodes, getEdges } = useReactFlow();

    return useMemo(() => {
        const nodes = getNodes();
        const edges = getEdges();
        const ancestorIds = getAncestorIds(nodeId, edges);

        return ancestorIds
            .map((id) => {
                const node = nodes.find((n) => n.id === id);
                if (!node) return null;
                const nodeData = node.data as unknown as NodeData;
                if (nodeData.disabled) return null;
                const nodeType = nodeData.nodeType;
                const inputFields = getNodeInputFields(nodeType);
                if (!inputFields?.length) return null;
                return { nodeId: id, nodeType, inputFields };
            })
            .filter((x): x is AncestorWithInputs => x !== null);
    }, [nodeId, getNodes, getEdges]);
}
