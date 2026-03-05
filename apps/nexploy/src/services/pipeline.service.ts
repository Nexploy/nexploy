import { prisma } from '../../prisma/prisma';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';

export async function getPipelineConfig(repositoryId: string): Promise<PipelineGraph | null> {
    const config = await prisma.pipelineConfig.findUnique({
        where: { repositoryId },
    });

    if (!config) return null;

    return {
        nodes: config.nodes as unknown as PipelineGraph['nodes'],
        edges: config.edges as unknown as PipelineGraph['edges'],
    };
}

export async function savePipelineConfig(
    repositoryId: string,
    graph: PipelineGraph,
): Promise<void> {
    await prisma.pipelineConfig.upsert({
        where: { repositoryId },
        create: {
            repositoryId,
            nodes: graph.nodes as object[],
            edges: graph.edges as object[],
        },
        update: {
            nodes: graph.nodes as object[],
            edges: graph.edges as object[],
        },
    });
}

export interface PipelineValidationResult {
    valid: boolean;
    errors: string[];
}

export function validatePipelineGraph(graph: PipelineGraph): PipelineValidationResult {
    const errors: string[] = [];

    if (graph.nodes.length === 0) {
        errors.push('Pipeline must have at least one node');
        return { valid: false, errors };
    }

    const hasCloneNode = graph.nodes.some((n) => n.data.type === 'clone-repository');
    if (!hasCloneNode) {
        errors.push('Pipeline must start with a Clone Repository node');
    }

    // Check for cycles using DFS
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const adjacency = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));
    for (const edge of graph.edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            errors.push(`Edge references non-existent node`);
            continue;
        }
        adjacency.get(edge.source)?.push(edge.target);
    }

    // Detect cycle via DFS
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function hasCycle(nodeId: string): boolean {
        visited.add(nodeId);
        inStack.add(nodeId);

        for (const neighbor of adjacency.get(nodeId) ?? []) {
            if (!visited.has(neighbor)) {
                if (hasCycle(neighbor)) return true;
            } else if (inStack.has(neighbor)) {
                return true;
            }
        }

        inStack.delete(nodeId);
        return false;
    }

    for (const node of graph.nodes) {
        if (!visited.has(node.id)) {
            if (hasCycle(node.id)) {
                errors.push('Pipeline contains a cycle');
                break;
            }
        }
    }

    // Check disconnected nodes (nodes with no edges, except if there's only 1 node)
    if (graph.nodes.length > 1) {
        const connectedNodes = new Set<string>();
        for (const edge of graph.edges) {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        }
        const disconnected = graph.nodes.filter((n) => !connectedNodes.has(n.id));
        if (disconnected.length > 0) {
            errors.push('All nodes must be connected');
        }
    }

    return { valid: errors.length === 0, errors };
}
