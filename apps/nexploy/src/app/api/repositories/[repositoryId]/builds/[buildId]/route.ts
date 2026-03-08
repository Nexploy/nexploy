import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { prisma } from '../../../../../../../prisma/prisma';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';

const ACTIVE_STATUSES = new Set(['QUEUED', 'BUILDING', 'DEPLOYING']);

function getReachableNodeIds(snapshot: PipelineGraph): Set<string> {
    const startNodeIds = new Set(
        snapshot.nodes
            .filter((n) => getNodeDefinition(n.data.type)?.isStartNode === true)
            .map((n) => n.id),
    );
    const reachable = new Set<string>(startNodeIds);
    const adjacency = new Map<string, string[]>();
    for (const edge of snapshot.edges) {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
        adjacency.get(edge.source)!.push(edge.target);
        if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
        adjacency.get(edge.target)!.push(edge.source);
    }
    const queue = [...startNodeIds];
    while (queue.length > 0) {
        const id = queue.shift()!;
        for (const neighborId of adjacency.get(id) ?? []) {
            if (!reachable.has(neighborId)) {
                reachable.add(neighborId);
                queue.push(neighborId);
            }
        }
    }
    return reachable;
}

function findRunningNodeId(snapshot: PipelineGraph, completedSet: Set<string>): string | null {
    const reachable = getReachableNodeIds(snapshot);

    const deps = new Map<string, Set<string>>(snapshot.nodes.map((n) => [n.id, new Set()]));
    for (const edge of snapshot.edges) {
        deps.get(edge.target)?.add(edge.source);
    }

    const inDegree = new Map<string, number>();
    for (const [id, d] of deps) inDegree.set(id, d.size);

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
        if (deg === 0) queue.push(id);
    }

    const topoOrder: string[] = [];
    while (queue.length > 0) {
        const id = queue.shift()!;
        topoOrder.push(id);
        for (const edge of snapshot.edges) {
            if (edge.source === id) {
                const newDeg = (inDegree.get(edge.target) ?? 1) - 1;
                inDegree.set(edge.target, newDeg);
                if (newDeg === 0) queue.push(edge.target);
            }
        }
    }

    for (const id of topoOrder) {
        if (!reachable.has(id)) continue;
        if (completedSet.has(id)) continue;
        const nodeDeps = deps.get(id)!;
        if ([...nodeDeps].every((dep) => completedSet.has(dep) || !reachable.has(dep))) return id;
    }

    return null;
}

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('repository', 'read'))
    .handler(async (_, { params }) => {
        try {
            const { buildId } = await params;
            const build = await prisma.build.findUnique({
                where: { id: buildId },
                select: { completedNodes: true, status: true, pipelineSnapshot: true },
            });

            if (!build) {
                return NextResponse.json({ error: 'Build not found' }, { status: 404 });
            }

            const completedSet = new Set(build.completedNodes);
            let currentNodeId: string | null = null;

            if (ACTIVE_STATUSES.has(build.status) && build.pipelineSnapshot) {
                const snapshot = build.pipelineSnapshot as unknown as PipelineGraph;
                currentNodeId = findRunningNodeId(snapshot, completedSet);
            }

            return NextResponse.json({
                completedNodes: build.completedNodes,
                status: build.status,
                currentNodeId,
            });
        } catch {
            return NextResponse.json({ error: 'Failed to fetch build status' }, { status: 500 });
        }
    });
