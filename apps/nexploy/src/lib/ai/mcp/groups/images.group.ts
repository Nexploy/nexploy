import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    imageDeleteSchema,
    imagePruneSchema,
    imageTagBodySchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { fail, guard, guardDestructive, ok } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const imagesGroup: ToolGroup = {
    name: 'images',

    register(server: McpServer, ctx: ToolContext) {
        if (ctx.allowImagesGroup === false) return;

        server.registerTool(
            'listImages',
            { description: 'List all locally available Docker images.' },
            async () => {
                const g = guard(ctx, 'image', 'read');
                if (g) return g;
                try {
                    const images = await kyDocker
                        .get('images', { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json<any[]>();
                    const data = images.map((img) => ({
                        id: img.id,
                        tags: img.repoTags ?? img.tags ?? [],
                        size: img.size ? `${Math.round(img.size / 1024 / 1024)}MB` : 'unknown',
                    }));
                    return ok(JSON.stringify({ count: images.length, data }));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'inspectImage',
            {
                description: 'Get full inspection details of a Docker image.',
                inputSchema: z.object({ id: z.string().describe('Image ID or tag') }).shape,
            },
            async ({ id }) => {
                const g = guard(ctx, 'image', 'read');
                if (g) return g;
                try {
                    const data = await kyDocker
                        .get(`images/${id}`, { environmentId: ctx.environmentId } as KyDockerOptions)
                        .json();
                    return ok(JSON.stringify(data));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'pullImage',
            {
                description: 'Pull a Docker image from a registry.',
                inputSchema: imagePullSchema.shape,
            },
            async (params) => {
                const g = guard(ctx, 'image', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post('images/pull', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Started pulling \`${params.imageName}\`. This may take a moment.`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'tagImage',
            {
                description: 'Add a new tag to an existing Docker image.',
                inputSchema: z.object({
                    id: z.string().describe('Source image ID or existing tag'),
                    repo: imageTagBodySchema.shape.repo,
                    tag: imageTagBodySchema.shape.tag,
                }).shape,
            },
            async ({ id, repo, tag }) => {
                const g = guard(ctx, 'image', 'manage');
                if (g) return g;
                try {
                    await kyDocker
                        .post(`images/${id}/tag`, {
                            json: { repo, tag },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json();
                    return ok(`Image tagged as ${repo}:${tag}`);
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'deleteImages',
            {
                description: 'Delete one or more Docker images by ID.',
                inputSchema: imageDeleteSchema.shape,
            },
            async (params) => {
                const g = guardDestructive(ctx, 'image', 'manage', params.imageIds.join(','));
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('images/delete', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<{ deleted: string[]; skipped: { id: string; name: string; reason: string }[] }>();

                    if (result.deleted.length === 0 && result.skipped.length > 0) {
                        const reasons = result.skipped
                            .map((s) => `${s.name}: ${s.reason}`)
                            .join(', ');
                        return fail(`No images deleted. Skipped: ${reasons}`);
                    }

                    const parts: string[] = [];
                    if (result.deleted.length > 0)
                        parts.push(`Deleted ${result.deleted.length} image(s)`);
                    if (result.skipped.length > 0)
                        parts.push(
                            `skipped ${result.skipped.length} (${result.skipped.map((s) => s.reason).join(', ')})`,
                        );
                    return ok(parts.join(', '));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'pruneImages',
            {
                description: 'Remove unused Docker images. Requires admin role.',
                inputSchema: imagePruneSchema.shape,
            },
            async (params) => {
                const g = guardDestructive(ctx, 'image', 'remove', 'all-unused-images');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('images/prune', {
                            json: params,
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        server.registerTool(
            'scanImage',
            {
                description: 'Scan a Docker image for vulnerabilities using Trivy.',
                inputSchema: z.object({
                    image: z.string().describe('Image name and tag'),
                    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
                }).shape,
            },
            async ({ image, severity }) => {
                const g = guard(ctx, 'image', 'manage');
                if (g) return g;
                try {
                    const result = await kyDocker
                        .post('images/scan', {
                            json: { image, severity },
                            environmentId: ctx.environmentId,
                        } as KyDockerOptions)
                        .json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );
    },
};
