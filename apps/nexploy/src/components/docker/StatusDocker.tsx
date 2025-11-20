'use client';

import {
    Status,
    StatusIndicator,
    StatusLabel,
    StatusProps,
} from '@workspace/ui/components/kibo-ui/status';
import { Badge } from '@workspace/ui/components/badge';
import type { ComponentProps } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { DockerStatus } from '@workspace/typescript-interface/docker/docker.status';
import { useDockerStore } from '@/stores/docker/useDockerStore';

interface StatusDockerProps extends ComponentProps<typeof Badge> {
    disabledLabel?: boolean;
    mode?: 'icon' | 'full';
}

export function StatusDocker(props: StatusDockerProps) {
    const status = useDockerStore((state) => state.status);

    const statusMap: Record<DockerStatus, { status: StatusProps['status']; label: string }> = {
        connected: {
            status: 'online',
            label: 'Connected',
        },
        connecting: {
            status: 'degraded',
            label: 'Connecting...',
        },
        disconnected: {
            status: 'offline',
            label: 'Disconnected',
        },
        error: {
            status: 'offline',
            label: 'Error',
        },
    };

    return (
        <Status
            {...props}
            className={cn('mr-2', props.mode === 'icon' && 'bg-transparent p-1', props.className)}
            status={statusMap[status].status}
        >
            <StatusIndicator />
            {props.mode !== 'icon' && <StatusLabel>{statusMap[status].label}</StatusLabel>}
        </Status>
    );
}
