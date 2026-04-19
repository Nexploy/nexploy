import { route } from '@/helpers/route';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { HttpError } from '@workspace/shared/http-error';
import {
    imageDeleteSchema,
    imageIdParamSchema,
    imageMirrorSchema,
    imagePullWithAuthSchema,
    imageScanSchema,
    imageTagBodySchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { scanImage } from '@/services/trivyRunner';
import { deleteImages, mirrorImage, pullImage } from '@/services/imageService';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

app.post(
    '/scan',
    route({ json: imageScanSchema }, async (c) => {
        const { image, tag, severity, trivyVersion, buildId } = c.req.valid('json');
        return await scanImage(image, tag, severity, trivyVersion, buildId);
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

        const imageExists = imagesStateManager.getByName(imageName);
        if (imageExists) {
            throw new Error(`Image ${imageName} already exists locally.`);
        }

        return await pullImage(imageName, auth);
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
        return await docker.getImage(id).tag({ repo, tag });
    }),
);

app.post(
    '/mirror',
    route({ json: imageMirrorSchema }, async (c) => {
        const { sourceImage, sourceAuth, targetName, targetAuth } = c.req.valid('json');
        return await mirrorImage(sourceImage, sourceAuth, targetName, targetAuth);
    }),
);

app.post(
    '/delete',
    route({ json: imageDeleteSchema }, async (c) => {
        const { imageIds, force } = c.req.valid('json');

        if (imageIds.length === 0) {
            throw new HttpError('No image IDs provided.', 400);
        }

        return await deleteImages(imageIds, force ?? false);
    }),
);

export default app;
