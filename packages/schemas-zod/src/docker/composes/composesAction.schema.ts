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
    force: z.boolean().optional(),
});

export const composeProjectParamSchema = z.object({
    project: z.string().min(1),
});

export const composeStackNameSchema = z
    .string()
    .min(1, 'Stack name is required')
    .max(
        255,
        'Stack name must be 255 characters or less. You can use lowercase alphanumeric characters, hyphens, and underscores.',
    )
    .regex(
        /^[a-z0-9][a-z0-9_-]*$/,
        'must consist only of lowercase alphanumeric characters, hyphens, and underscores as well as start with a letter or number',
    );

export const deployComposeSchema = z.object({
    stackName: composeStackNameSchema,
    yaml: z.string().min(1),
});

export const validateComposeSyntaxSchema = z.object({
    content: z.string().min(1),
});

export const composeActionMcpSchema = z.object({
    stackName: z.string().min(1).describe('Docker Compose stack/project name'),
    action: z
        .enum(composesActions)
        .describe('Action to perform. "remove" stops and removes all containers in the stack.'),
});

export const composeStackNameMcpSchema = z.object({
    stackName: z.string().describe('Compose stack/project name'),
});

export const validateComposeSyntaxMcpSchema = z.object({
    yaml: z.string().describe('Docker Compose YAML content'),
});
