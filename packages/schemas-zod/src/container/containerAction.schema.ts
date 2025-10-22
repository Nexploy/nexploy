import { z } from 'zod';
import { ContainerAction } from '@workspace/typescript-interface/docker.container';

const dockerActions: [ContainerAction, ...ContainerAction[]] = [
    'start',
    'stop',
    'restart',
    'pause',
    'unpause',
    'kill',
    'remove',
];

export const ContainerActionsSchema = z.object({
    action: z.enum(dockerActions),
    containerId: z.string(),
});
