'use client';

import { Badge } from '@workspace/ui/components/badge';
import { TableCell, TableRow } from '@workspace/ui/components/table';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import type { SwarmTask, SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';

function taskStateToStatus(
    state: SwarmTaskState,
): 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting' {
    switch (state) {
        case 'running':
            return 'online';
        case 'failed':
        case 'rejected':
        case 'orphaned':
            return 'offline';
        case 'complete':
        case 'shutdown':
            return 'maintenance';
        case 'remove':
            return 'degraded';
        default:
            return 'waiting';
    }
}

export function TaskRow({ task }: { task: SwarmTask }) {
    return (
        <TableRow className="h-11">
            <TableCell className="font-mono text-xs">
                {task.slot !== undefined ? `#${task.slot}` : task.id.slice(0, 12)}
            </TableCell>
            <TableCell>
                <Status
                    className="border-0 text-sm"
                    status={taskStateToStatus(task.state)}
                    variant="outline"
                >
                    <StatusIndicator />
                    <StatusLabel className="text-sm capitalize">{task.state}</StatusLabel>
                </Status>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                    {task.desiredState}
                </Badge>
            </TableCell>
            <TableCell className="text-sm">{task.nodeHostname ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">
                {task.containerStatus?.containerId
                    ? task.containerStatus.containerId.slice(0, 12)
                    : '—'}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-xs text-red-500">
                {task.error ?? '—'}
            </TableCell>
        </TableRow>
    );
}
