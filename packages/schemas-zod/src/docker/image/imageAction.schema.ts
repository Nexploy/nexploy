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

export const imageActionsSchema = z.object({
    action: z.enum(imageActions),
    force: z.boolean().default(false),
    imageIds: z.array(z.string()),
});

export const imageDeleteSchema = z.object({
    imageIds: z.array(z.string()),
    force: z.boolean().default(false),
});

export const imageAuthSchema = z.object({
    username: z.string(),
    password: z.string(),
    serveraddress: z.string().optional(),
});

export const imagePullWithAuthSchema = z.object({
    imageName: z.string().min(1),
    auth: imageAuthSchema.optional(),
});

export const imageMirrorSchema = z.object({
    sourceImage: z.string().min(1),
    sourceAuth: imageAuthSchema.optional(),
    targetName: z.string().min(1),
    targetAuth: imageAuthSchema.extend({ serveraddress: z.string() }),
});

export const imageIdParamSchema = z.object({
    id: z.string().min(1),
});

export const imageNameParamSchema = z.object({
    name: z.string().min(1),
});

export const imageScanSchema = z.object({
    image: z.string().min(1),
    tag: z.string().min(1),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    trivyVersion: z.string().optional(),
    buildId: z.string().min(1),
});

export const imageTagBodySchema = z.object({
    repo: z.string().min(1),
    tag: z.string().min(1),
});

export const imagePruneSchema = z.object({
    dangling: z.boolean().default(true),
    filter: z.string().optional(),
    olderThan: z.string().optional(),
});
