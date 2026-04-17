import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { HttpError } from '@workspace/shared/http-error';
import { zValidator } from '@hono/zod-validator';
import {
    imageDeleteSchema,
    imageIdParamSchema,
    imageMirrorSchema,
    imagePullWithAuthSchema,
    imageNameParamSchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';
import { scanImage, type Severity } from '@/services/trivyRunner';
import { pullImage, mirrorImage } from '@/services/imageService';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

app.post(
    '/scan',
    handleAsync(async (c) => {
        const { image, tag, severity, trivyVersion, buildId } = await c.req.json<{
            image: string;
            tag: string;
            severity: Severity;
            trivyVersion?: string;
            buildId?: string;
        }>();

        return await scanImage(image, tag, severity, trivyVersion, buildId);
    }),
);

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await imagesStateManager.hardRefresh();
    }),
);

app.get(
    '/',
    handleAsync(async () => {
        return imagesStateManager.getAllImages();
    }),
);

app.get(
    '/name/:name',
    zValidator('param', imageNameParamSchema),
    handleAsync(async (c) => {
        const { name } = getValidatedParam(c, imageNameParamSchema);
        return imagesStateManager.getByName(name);
    }),
);

app.get(
    '/id/:id',
    zValidator('param', imageIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, imageIdParamSchema);
        return imagesStateManager.getById(id);
    }),
);

app.get(
    '/:id',
    zValidator('param', imageIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, imageIdParamSchema);
        return imagesStateManager.getById(id);
    }),
);

app.post(
    '/pull',
    zValidator('json', imagePullWithAuthSchema),
    handleAsync(async (c) => {
        const { imageName, auth } = getValidatedJson(c, imagePullWithAuthSchema);

        const imageExists = imagesStateManager.checkIfExistByName(imageName);
        if (imageExists) {
            throw new Error(`Image ${imageName} already exists locally.`);
        }

        return await pullImage(imageName, auth);
    }),
);

app.get(
    '/:id/history',
    zValidator('param', imageIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, imageIdParamSchema);
        return await docker.getImage(id).history();
    }),
);

app.post(
    '/:id/tag',
    zValidator('param', imageIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, imageIdParamSchema);
        const { repo, tag } = await c.req.json<{ repo: string; tag: string }>();
        return await docker.getImage(id).tag({ repo, tag });
    }),
);

app.post(
    '/mirror',
    zValidator('json', imageMirrorSchema),
    handleAsync(async (c) => {
        const { sourceImage, sourceAuth, targetName, targetAuth } = getValidatedJson(
            c,
            imageMirrorSchema,
        );

        return await mirrorImage(sourceImage, sourceAuth, targetName, targetAuth);
    }),
);

app.post(
    '/delete',
    zValidator('json', imageDeleteSchema),
    handleAsync(async (c) => {
        const { imageIds, force } = getValidatedJson(c, imageDeleteSchema);

        if (imageIds.length === 0) {
            throw new HttpError('No image IDs provided.', 400);
        }

        await Promise.all(imageIds.map((id: string) => docker.getImage(id).remove({ force })));

        return { deleted: imageIds };
    }),
);

export default app;
