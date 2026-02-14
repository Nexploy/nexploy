import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { imagesStateManager } from '@/managers/imagesStateManager';
import { getTranslations } from '@/middleware/locale.middleware';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await imagesStateManager.hardRefresh();
    }),
);

app.get(
    '/versions',
    handleAsync(async (c) => {
        const repositoryId = c.req.query('repositoryId');
        if (!repositoryId) {
            return c.json({ error: 'repositoryId is required' }, 400);
        }
        return imagesStateManager.getVersionsByRepository(repositoryId);
    }),
);

app.get(
    '/',
    handleAsync(async (c) => {
        const name = c.req.query('name');

        if (name) {
            return imagesStateManager.getByName(name);
        }

        return imagesStateManager.getAllImages();
    }),
);

app.post(
    '/pull',
    handleAsync(async (c) => {
        const { imageName } = await c.req.json();

        const imageExists = imagesStateManager.getByName(imageName);
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
    handleAsync(async (c) => {
        const id = c.req.param('id');
        const image = docker.getImage(id);
        return await image.history();
    }),
);

app.post(
    '/:id/tag',
    handleAsync(async (c) => {
        const { repo, tag } = await c.req.json();
        const image = docker.getImage(c.req.param('imageId'));

        return await image.tag({ repo, tag });
    }),
);

app.post(
    '/delete',
    handleAsync(async (c) => {
        const { imageIds } = await c.req.json();

        if (imageIds.length === 0) {
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.noImageIdsProvided') }, 400);
        }

        const force = c.req.query('force') === 'true';

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
