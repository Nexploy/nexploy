'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Crown, Server } from 'lucide-react';
import { NodeActions } from './NodeActions';
import type {
    SwarmNode,
    SwarmNodeAvailability,
    SwarmNodeState,
} from '@workspace/typescript-interface/docker/swarm';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCPUs(nanoCPUs: number): string {
    return (nanoCPUs / 1e9).toFixed(2);
}

function getStateBadgeVariant(
    state: SwarmNodeState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (state) {
        case 'ready':
            return 'default';
        case 'down':
            return 'destructive';
        case 'disconnected':
            return 'destructive';
        default:
            return 'secondary';
    }
}

function getAvailabilityBadgeVariant(
    availability: SwarmNodeAvailability,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (availability) {
        case 'active':
            return 'default';
        case 'pause':
            return 'secondary';
        case 'drain':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function NodesTable() {
    const { nodes, isSwarmActive } = useSwarmStore();

    if (!isSwarmActive) {
        return null;
    }

    if (nodes.length === 0) {
        return (
            <div className="px-5">
                <div className="bg-muted/50 rounded-lg border p-8 text-center">
                    <Server className="text-muted-foreground mx-auto mb-4 size-12" />
                    <h3 className="text-lg font-semibold">No nodes found</h3>
                    <p className="text-muted-foreground text-sm">
                        No nodes are currently part of this swarm.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hostname</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Availability</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Engine</TableHead>
                            <TableHead>Resources</TableHead>
                            <TableHead>Labels</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {nodes.map((node: SwarmNode) => (
                            <TableRow key={node.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {node.managerStatus?.leader && (
                                            <Crown className="size-4 text-yellow-500" />
                                        )}
                                        {node.hostname}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={node.role === 'manager' ? 'default' : 'secondary'}
                                    >
                                        {node.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStateBadgeVariant(node.state)}>
                                        {node.state}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getAvailabilityBadgeVariant(node.availability)}>
                                        {node.availability}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {node.address || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {node.engineVersion || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatCPUs(node.resources.nanoCPUs)} CPUs /{' '}
                                    {formatBytes(node.resources.memoryBytes)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(node.labels || {})
                                            .slice(0, 2)
                                            .map(([key, value]) => (
                                                <Badge
                                                    key={key}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {key}={value}
                                                </Badge>
                                            ))}
                                        {Object.keys(node.labels || {}).length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{Object.keys(node.labels).length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <NodeActions node={node} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
