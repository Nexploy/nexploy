'use client';

import { Badge } from '@workspace/ui/components/badge';
import type { SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';

interface TaskStatusBadgeProps {
    state: SwarmTaskState;
}

function getTaskStateBadgeVariant(
    state: SwarmTaskState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (state) {
        case 'running':
        case 'complete':
            return 'default';
        case 'new':
        case 'pending':
        case 'assigned':
        case 'accepted':
        case 'preparing':
        case 'ready':
        case 'starting':
            return 'secondary';
        case 'failed':
        case 'rejected':
        case 'orphaned':
            return 'destructive';
        case 'shutdown':
        case 'remove':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function TaskStatusBadge({ state }: TaskStatusBadgeProps) {
    return <Badge variant={getTaskStateBadgeVariant(state)}>{state}</Badge>;
}
