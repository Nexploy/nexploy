import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { StatusProps } from '@workspace/ui/components/kibo-ui/status';

export const containerDisplayState: Record<ContainerState, StatusProps['status']> = {
    created: 'offline',
    running: 'online',
    restarting: 'degraded',
    paused: 'maintenance',
    exited: 'offline',
    dead: 'degraded',
};
