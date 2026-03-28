import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { getTranslations } from '@/middleware/locale.middleware';
import { HttpError } from '@workspace/shared/http-error';
import { zValidator } from '@hono/zod-validator';
import {
    imageDeleteSchema,
    imageIdParamSchema,
    imageMirrorSchema,
} from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';

const app = new Hono();

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

app.post(
    '/pull',
    zValidator('json', imagePullSchema),
    handleAsync(async (c) => {
        const { imageName } = getValidatedJson(c, imagePullSchema);

        const imageExists = imagesStateManager.checkIfExistByName(imageName);
        if (imageExists) {
            const t = getTranslations(c, 'docker');
            throw new Error(t('errors.imageAlreadyExists', { imageName }));
        }

        await new Promise((resolve, reject) => {
            docker.pull(imageName, (err: any, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);

                docker.modem.followProgress(stream, (error: any, output: any) => {
                    if (error) return reject(error);
                    resolve(output);
                });
            });
        });

        return { imageName };
    }),
);

app.get(
    '/:id/history',
    zValidator('param', imageIdParamSchema),
    handleAsync(async (c) => {
        const { id } = getValidatedParam(c, imageIdParamSchema);
        const image = docker.getImage(id);
        return await image.history();
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

        let sourceExistedBefore = false;
        try {
            await docker.getImage(sourceImage).inspect();
            sourceExistedBefore = true;
        } catch {
            sourceExistedBefore = false;
        }

        await new Promise((resolve, reject) => {
            const pullOptions: Record<string, unknown> = {};
            if (sourceAuth) {
                pullOptions.authconfig = sourceAuth;
            }
            (docker.pull as any)(sourceImage, pullOptions, (err: any, stream: any) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (error: any, output: any) => {
                    if (error) return reject(error);
                    resolve(output);
                });
            });
        });

        await new Promise((resolve, reject) => {
            const taggedImage = docker.getImage(targetName);
            (taggedImage.push as any)({ authconfig: targetAuth }, (err: any, stream: any) => {
                if (err) return reject(err);
                docker.modem.followProgress(
                    stream,
                    (error: any, output: any) => {
                        if (error) return reject(error);
                        resolve(output);
                    },
                    (event: any) => {
                        if (event.error) reject(new Error(event.error));
                    },
                );
            });
        });

        try {
            await docker.getImage(targetName).remove();
        } catch {}
        if (!sourceExistedBefore) {
            try {
                await docker.getImage(sourceImage).remove();
            } catch {}
        }

        return { success: true, targetName };
    }),
);

app.post(
    '/delete',
    zValidator('json', imageDeleteSchema),
    handleAsync(async (c) => {
        const { imageIds, force } = getValidatedJson(c, imageDeleteSchema);

        if (imageIds.length === 0) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.noImageIdsProvided'), 400);
        }

        await Promise.all(
            imageIds.map(async (imageId: string) => {
                const image = docker.getImage(imageId);
                return await image.remove({ force });
            }),
        );

        return { deleted: imageIds };
    }),
);

export default app;
