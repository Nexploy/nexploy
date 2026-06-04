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

export const deployComposeSchema = z.object({
    projectName: z.string().min(1),
    yaml: z.string().min(1),
});

export const validateComposeSyntaxSchema = z.object({
    content: z.string().min(1),
});

export const composeActionMcpSchema = z.object({
    stackName: z.string().min(1).describe('Docker Compose stack/project name'),
    action: z.enum(composesActions).describe(
        'Action to perform. "remove" stops and removes all containers in the stack.',
    ),
});

export const composeStackNameMcpSchema = z.object({
    stackName: z.string().describe('Compose stack/project name'),
});

export const validateComposeSyntaxMcpSchema = z.object({
    yaml: z.string().describe('Docker Compose YAML content'),
});
