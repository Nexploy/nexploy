import { z } from 'zod';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';

const composesActions: [ComposesAction, ...ComposesAction[]] = [
    'start',
    'stop',
    'restart',
    'pause',
    'unpause',
    'remove',
];

export const composesActionsSchema = z.object({
    action: z.enum(composesActions),
    stackName: z.string(),
});

export const composeProjectParamSchema = z.object({
    project: z.string().min(1),
});
