import { docker } from '@/utils/dockerClient';
import { handleAsync } from '@/helpers/handleAsync';
import { Hono } from 'hono';
import { imageStateManager } from '@/managers/imageStateManager';

const app = new Hono();

app.post(
    '/hardRefresh',
    handleAsync(async () => {
        return await imageStateManager.hardRefresh();
    }),
);

/**
 * @openapi
 * /images:
 *   get:
 *     summary: List images
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Array of images
 */
app.get(
    '/',
    handleAsync(async () => {
        return imageStateManager.getAllImages();
    }),
);

/**
 * @openapi
 * /images/pull:
 *   post:
 *     summary: Pull an image
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image pulled
 */
app.post(
    '/pull',
    handleAsync(async (c) => {
        const { imageName } = await c.req.json();

        const imageExists = imageStateManager.getByName(imageName);
        if (imageExists) {
            throw new Error(`L'image ${imageName} existe déjà localement.`);
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

/**
 * @openapi
 * /images/{id}/tag:
 *   post:
 *     summary: Tag an image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repo:
 *                 type: string
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image tagged
 */
app.post(
    '/:id/tag',
    handleAsync(async (c) => {
        const { repo, tag } = await c.req.json();
        const image = docker.getImage(c.req.param('imageId'));

        return await image.tag({ repo, tag });
    }),
);

/**
 * @openapi
 * /images/{id}:
 *   delete:
 *     summary: Remove an image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Image removed
 */
app.post(
    '/delete',
    handleAsync(async (c) => {
        const { imageIds } = await c.req.json();

        if (imageIds.length === 0) {
            return c.json({ error: 'No imageIds provided' }, 400);
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
