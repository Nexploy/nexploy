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

export const ComposesActionsSchema = z.object({
    action: z.enum(composesActions),
    stackName: z.string(),
});
