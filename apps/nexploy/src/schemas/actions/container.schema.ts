import { z } from 'zod';
import { DockerAction } from '@workspace/typescript-interface/docker';

const dockerActions: [DockerAction, ...DockerAction[]] = [
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
