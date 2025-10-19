import {
    Status,
    StatusIndicator,
    StatusLabel,
    StatusProps,
} from '@workspace/ui/components/kibo-ui/status';
import { useContainerStore } from '@/stores/useContainerStore';
import { Badge } from '@workspace/ui/components/badge';
import type { ComponentProps } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { DockerStatus } from '@workspace/typescript-interface/docker';
import { capitalizeFirstLetter } from '@/utils/capitalize';

export function StatusDocker(props: ComponentProps<typeof Badge>) {
    const dockerStatus = useContainerStore((state) => state.dockerStatus);

    const status: Record<DockerStatus, StatusProps['status']> = {
        connected: 'online',
        connecting: 'degraded',
        disconnected: 'offline',
        error: 'offline',
    };

    return (
        <Status {...props} className={cn('mr-2', props.className)} status={status[dockerStatus]}>
            <StatusIndicator />
            <StatusLabel>{capitalizeFirstLetter(dockerStatus)}</StatusLabel>
        </Status>
    );
}
