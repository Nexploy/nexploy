import { Hono } from 'hono';
import { HttpError, route } from '@/utils/route';
import {
    composeProjectParamSchema,
    deployComposeSchema,
    validateComposeSyntaxSchema,
} from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { docker } from '@/utils/dockerClient';
import { controlComposeStack } from '@/services/composeService';
import { parse as parseYaml, YAMLParseError } from 'yaml';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildDockerHostEnv, runDockerCompose } from '@/utils/compose/dockerComposeRunner';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';

const app = new Hono();

app.get(
    '/',
    route({}, async () => {
        const containers = await docker.listContainers({ all: true });
        const stackMap = new Map<string, { running: number; total: number; services: string[] }>();

        for (const c of containers) {
            const project = c.Labels?.['com.docker.compose.project'];
            if (!project) continue;

            const service = c.Labels?.['com.docker.compose.service'] ?? '';
            const isRunning = c.State === 'running';

            if (!stackMap.has(project)) {
                stackMap.set(project, { running: 0, total: 0, services: [] });
            }
            const entry = stackMap.get(project)!;
            entry.total++;
            if (isRunning) entry.running++;
            if (service && !entry.services.includes(service)) entry.services.push(service);
        }

        return Array.from(stackMap.entries()).map(([name, stats]) => ({ name, ...stats }));
    }),
);

app.get(
    '/:project/status',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');

        const containers = await docker.listContainers({
            all: true,
            filters: { label: [`com.docker.compose.project=${project}`] },
        });

        const byState: Record<string, number> = {};
        for (const c of containers) {
            byState[c.State] = (byState[c.State] ?? 0) + 1;
        }

        return {
            projectName: project,
            total: containers.length,
            byState,
            containers: containers.map((c) => ({
                id: c.Id.slice(0, 12),
                name: c.Names[0]?.replace(/^\//, '') ?? '',
                service: c.Labels?.['com.docker.compose.service'] ?? '',
                state: c.State,
                status: c.Status,
            })),
        };
    }),
);

app.post(
    '/deploy',
    route({ json: deployComposeSchema }, async (c) => {
        const { projectName, yaml } = c.req.valid('json');

        const environmentId = getCurrentEnvironmentId();
        const envConfig = environmentId
            ? dockerClientRegistry.getEnvironmentConfig(environmentId)
            : null;
        const dockerEnvResult = buildDockerHostEnv(envConfig);
        const dockerEnv = dockerEnvResult.env;

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-mcp-compose-'));
        const composeFile = path.join(tmpDir, 'docker-compose.yml');

        try {
            fs.writeFileSync(composeFile, yaml, 'utf8');

            const logs: string[] = [];
            const exitCode = await runDockerCompose(
                ['-p', projectName, '-f', composeFile, 'up', '-d', '--remove-orphans'],
                tmpDir,
                dockerEnv,
                (line) => logs.push(line),
            );

            if (exitCode !== 0) {
                throw new HttpError(`docker compose up failed (exit ${exitCode}): ${logs.slice(-5).join('; ')}`, 500);
            }

            return { success: true, projectName, logs };
        } finally {
            dockerEnvResult.cleanup?.();
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        }
    }),
);

app.post(
    '/validate-syntax',
    route({ json: validateComposeSyntaxSchema }, async (c) => {
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
