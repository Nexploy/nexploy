import { route } from '@/utils/route';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/list/imagesStateManager';
import { HttpError } from '@nexploy/shared/http-error';
import {
    imageDeleteSchema,
    imageIdParamSchema,
    imageImportSchema,
    imageMirrorSchema,
    imagePruneSchema,
    imagePullWithAuthSchema,
    imagePushWithAuthSchema,
    imageSaveSchema,
    imageScanSchema,
    imageTagBodySchema,
    imageTagSchema,
    imageUntagSchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { scanImage } from '@/services/trivyRunner';
import {
    deleteImages,
    loadImages,
    saveImages,
    startImageImport,
    startImageMirror,
    startImagePull,
    startImagePush,
    untagImages,
} from '@/services/imageService';
import { Readable } from 'node:stream';
import { runTrackedTask } from '@/lib/taskRunner';
import { describeImages } from '@/utils/taskSubjects';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

app.post(
    '/scan',
    route({ json: imageScanSchema }, async (c) => {
        const { image, severity, trivyVersion, buildId } = c.req.valid('json');
        return await scanImage(image, severity, trivyVersion, buildId);
    }),
);

app.post(
    '/hardRefresh',
    route(async () => {
        return await imagesStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    route(async () => {
        return imagesStateManager.getAllImages();
    }),
);

app.get(
    '/:id',
    route({ param: imageIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        return imagesStateManager.getById(id);
    }),
);

app.post(
    '/pull',
    route({ json: imagePullWithAuthSchema }, async (c) => {
        const { imageName, auth } = c.req.valid('json');

        try {
            await docker.getImage(imageName).inspect();
            throw new HttpError(`Image ${imageName} already exists locally.`, 409);
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err.statusCode !== 404) throw err;
        }

        return startImagePull(imageName, auth);
    }),
);

app.post(
    '/push',
    route({ json: imagePushWithAuthSchema }, async (c) => {
        const { imageName, auth } = c.req.valid('json');

        await docker.getImage(imageName).inspect();

        return startImagePush(imageName, auth);
    }),
);

app.post(
    '/tag',
    route({ json: imageTagSchema }, async (c) => {
        const { imageId, repo, tag } = c.req.valid('json');

        return runTrackedTask({
            kind: 'image-tag',
            subjectName: `${repo}:${tag}`,
            run: () => docker.getImage(imageId).tag({ repo, tag }),
        });
    }),
);

app.post(
    '/untag',
    route({ json: imageUntagSchema }, async (c) => {
        const { tags } = c.req.valid('json');

        return runTrackedTask({
            kind: 'image-untag',
            subjectName: tags.join(', '),
            run: () => untagImages(tags),
        });
    }),
);

app.post(
    '/import',
    route({ json: imageImportSchema }, async (c) => {
        const { source, repo, tag } = c.req.valid('json');

        return startImageImport(source, repo, tag);
    }),
);

app.post(
    '/load',
    route(
        async (c) => {
            const body = c.req.raw.body;
            if (!body) throw new HttpError('An image archive is required.', 400);

            return runTrackedTask({
                kind: 'image-load',
                subjectName: '',
                run: () => loadImages(Readable.fromWeb(body as never)),
            });
        },
        { timeoutMs: 900_000 },
    ),
);

app.post('/save', async (c) => {
    const parsed = imageSaveSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: 'Validation failed' }, 400);

    const missing = parsed.data.imageIds.find((imageId) => !imagesStateManager.getById(imageId));
    if (missing) return c.json({ message: `Image ${missing} not found.` }, 404);

    const archive = await saveImages(parsed.data.imageIds);

    return new Response(Readable.toWeb(archive as Readable) as ReadableStream, {
        headers: {
            'Content-Type': 'application/x-tar',
            'Content-Disposition': 'attachment; filename="images.tar"',
        },
    });
});

app.get(
    '/:id/history',
    route({ param: imageIdParamSchema }, async (c) => {
        const { id } = c.req.valid('param');
        return await docker.getImage(id).history();
    }),
);

app.post(
    '/:id/tag',
    route({ param: imageIdParamSchema, json: imageTagBodySchema }, async (c) => {
        const { id } = c.req.valid('param');
        const { repo, tag } = c.req.valid('json');

        return runTrackedTask({
            kind: 'image-tag',
            subjectName: tag ? `${repo}:${tag}` : repo,
            run: () => docker.getImage(id).tag({ repo, tag }),
        });
    }),
);

app.post(
    '/mirror',
    route({ json: imageMirrorSchema }, async (c) => {
        const { sourceImage, sourceAuth, targetName, targetAuth } = c.req.valid('json');
        return startImageMirror(sourceImage, sourceAuth, targetName, targetAuth);
    }),
);

app.post(
    '/delete',
    route({ json: imageDeleteSchema }, async (c) => {
        const { imageIds, force } = c.req.valid('json');

        return runTrackedTask({
            kind: 'image-remove',
            subjectName: describeImages(imageIds),
            run: () => deleteImages(imageIds, force),
        });
    }),
);

app.post(
    '/prune',
    route({ json: imagePruneSchema }, async (c) => {
        const { dangling, filter, olderThan } = c.req.valid('json');

        const filters: Record<string, string[]> = {
            dangling: [dangling ? '1' : '0'],
        };
        if (olderThan) filters.until = [olderThan];
        if (filter) filters.label = [filter];

        return runTrackedTask({
            kind: 'image-prune',
            subjectName: '',
            run: async () => {
                const result = await docker.pruneImages({ filters: JSON.stringify(filters) });

                return {
                    removedImages: result.ImagesDeleted?.length ?? 0,
                    reclaimedSpace: result.SpaceReclaimed ?? 0,
                };
            },
        });
    }),
);

export default app;
