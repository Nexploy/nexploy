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
import { useTranslations } from 'next-intl';

interface StatusDockerProps extends ComponentProps<typeof Badge> {
    disabledLabel?: boolean;
    mode?: 'icon' | 'full';
}

export function StatusDocker(props: StatusDockerProps) {
    const status = useDockerStore((state) => state.status);
    const t = useTranslations('docker.status');

    const statusMap: Record<DockerStatus, { status: StatusProps['status']; labelKey: string }> = {
        connected: {
            status: 'online',
            labelKey: 'connected',
        },
        connecting: {
            status: 'degraded',
            labelKey: 'connecting',
        },
        disconnected: {
            status: 'offline',
            labelKey: 'disconnected',
        },
        error: {
            status: 'offline',
            labelKey: 'error',
        },
    };

    return (
        <Status
            {...props}
            className={cn('mr-2', props.mode === 'icon' && 'bg-transparent p-1', props.className)}
            status={statusMap[status].status}
        >
            <StatusIndicator />
            {props.mode !== 'icon' && <StatusLabel>{t(statusMap[status].labelKey)}</StatusLabel>}
        </Status>
    );
}
