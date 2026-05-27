import { Hono } from 'hono';
import { HttpError, route } from '@/utils/route';
import { composeProjectParamSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { docker } from '@/utils/dockerClient';
import { controlComposeStack } from '@/services/composeService';
import { parse as parseYaml, YAMLParseError } from 'yaml';
import { z } from 'zod';

const validateSyntaxBodySchema = z.object({ content: z.string().min(1) });

const app = new Hono();

app.post(
    '/validate-syntax',
    route({ json: validateSyntaxBodySchema }, async (c) => {
        const { content } = c.req.valid('json');

        let parsed: unknown;
        try {
            parsed = parseYaml(content);
        } catch (err) {
            const message = err instanceof YAMLParseError ? err.message : 'Invalid YAML syntax';
            throw new HttpError(message, 422);
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new HttpError('Invalid Docker Compose file: not a YAML mapping', 422);
        }

        if (!('services' in parsed)) {
            throw new HttpError(
                'Invalid Docker Compose file: missing required "services" key',
                422,
            );
        }

        return { valid: true };
    }),
);

app.get(
    '/:project/list',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project: projectName } = c.req.valid('param');

        return await docker.listContainers({
            filters: {
                label: [`com.docker.compose.project=${projectName}`],
            },
        });
    }),
);

app.post(
    '/:project/start',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'start');
    }),
);

app.post(
    '/:project/stop',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'stop');
    }),
);

app.post(
    '/:project/pause',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'pause');
    }),
);

app.post(
    '/:project/unpause',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'unpause');
    }),
);

app.post(
    '/:project/restart',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'restart');
    }),
);

app.post(
    '/:project/remove',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'remove');
    }),
);

export default app;
