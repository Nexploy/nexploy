import { route } from '@/utils/route';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/list/imagesStateManager';
import { HttpError } from '@nexploy/shared/http-error';
import {
    imageDeleteSchema,
    imageIdParamSchema,
    imageMirrorSchema,
    imagePruneSchema,
    imagePullWithAuthSchema,
    imageScanSchema,
    imageTagBodySchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { scanImage } from '@/services/trivyRunner';
import { deleteImages, startImageMirror, startImagePull } from '@/services/imageService';
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
