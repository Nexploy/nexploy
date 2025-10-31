import { z } from 'zod';
import { ImageAction } from '@workspace/typescript-interface/docker/docker.image';

const imageActions: [ImageAction, ...ImageAction[]] = [
    'pull',
    'push',
    'tag',
    'untag',
    'delete',
    'import',
    'load',
    'save',
];

export const ImageActionsSchema = z.object({
    action: z.enum(imageActions),
    force: z.boolean().optional(),
    imageIds: z.array(z.string()),
});
