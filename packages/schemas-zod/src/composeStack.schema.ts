import { z } from 'zod';
import { ComposeStackAction } from '@workspace/typescript-interface/docker.composeStack';

const composeStackActions: [ComposeStackAction, ...ComposeStackAction[]] = [
    'start',
    'stop',
    'restart',
    'pause',
    'unpause',
    'remove',
];

export const ComposeStackActionsSchema = z.object({
    action: z.enum(composeStackActions),
    stackId: z.string(),
});
