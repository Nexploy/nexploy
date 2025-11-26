import { Hono } from 'hono';
import { z } from 'zod';
import { handleAsync } from '@/helpers/handleAsync';
import { logger } from '@/utils/logger';
import { buildJobStore } from '@/deployer/jobs/store';
import { addBuildJob } from '@/deployer/jobs/queue';
import { dockerService } from '@/deployer/docker/dockerService';
import type {
    BuildConfig,
    BuildJob,
    BuildStartResponse,
    BuildStatusResponse,
} from '@/deployer/types';

const app = new Hono();

function generateId(): string {
    return (
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
}

const buildConfigSchema = z.object({
    projectId: z.string(),
    projectPath: z.string().default('.'),
    gitUrl: z.string().url(),
    gitBranch: z.string().default('main'),
    gitToken: z.string().optional(),
    envVariables: z.record(z.string(), z.string()).default({}),
    dockerfile: z.string().optional(),
    dockerfilePath: z.string().optional(),
    imageName: z.string(),
    imageTag: z.string().default('latest'),
    port: z.number().optional(),
    autoDeploy: z.boolean().default(true),
});

app.post(
    '/start',
    handleAsync(async (c) => {
        const body = await c.req.json();
        const parsed = buildConfigSchema.safeParse(body);

        if (!parsed.success) {
            const err = new Error('Validation failed');
            (err as any).status = 400;
            (err as any).details = parsed.error.issues;
            throw err;
        }

        const config: BuildConfig = parsed.data;
        const jobId = generateId();

        const buildJob: BuildJob = {
            id: jobId,
            config,
            status: 'pending',
            logs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await buildJobStore.set(jobId, buildJob);
        await addBuildJob(jobId, config);

        logger.info({ jobId, projectId: config.projectId }, 'Build job created');

        const response: BuildStartResponse = {
            jobId,
            status: 'pending',
            message: 'Build job queued successfully',
        };

        return response;
    }),
);

app.get(
    '/status/:id',
    handleAsync(async (c) => {
        const jobId = c.req.param('id');
        const buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        const response: BuildStatusResponse = {
            jobId: buildJob.id,
            status: buildJob.status,
            logs: buildJob.logs,
            createdAt: buildJob.createdAt,
            updatedAt: buildJob.updatedAt,
            completedAt: buildJob.completedAt,
            error: buildJob.error,
            imageId: buildJob.imageId,
            deploymentId: buildJob.deploymentId,
            containerId: buildJob.containerId,
            port: buildJob.port,
        };

        return response;
    }),
);

app.get(
    '/list',
    handleAsync(async () => {
        const jobs = buildJobStore.getAll().map((job) => ({
            jobId: job.id,
            projectId: job.config.projectId,
            imageName: job.config.imageName,
            status: job.status,
            port: job.port,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        }));

        return { jobs };
    }),
);

app.get(
    '/logs/:id',
    handleAsync(async (c) => {
        const jobId = c.req.param('id');
        let buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            buildJob = await buildJobStore.getFromRedis(jobId);
        }

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        const logs = await buildJobStore.getLogs(jobId);

        return {
            jobId: buildJob.id,
            status: buildJob.status,
            logs,
        };
    }),
);

// Deploy management routes
app.post(
    '/redeploy',
    handleAsync(async (c) => {
        const { jobId, port } = await c.req.json();
        const buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        if (buildJob.status !== 'completed') {
            const err = new Error('Build must be completed before redeployment');
            (err as any).status = 400;
            throw err;
        }

        const imageName = dockerService.getLocalImageName(buildJob.config);

        const deployResult = await dockerService.deploy(buildJob.config.projectId, imageName, {
            port: port || buildJob.port || 3000,
            envVars: buildJob.config.envVariables,
        });

        buildJob.deploymentId = deployResult.deploymentId;
        buildJob.containerId = deployResult.containerId;
        buildJob.port = deployResult.port;
        buildJob.updatedAt = new Date();
        await buildJobStore.set(jobId, buildJob);

        logger.info({ jobId, deploymentId: deployResult.deploymentId }, 'Redeployment started');

        return {
            jobId,
            deploymentId: deployResult.deploymentId,
            containerId: deployResult.containerId,
            port: deployResult.port,
            status: 'running',
        };
    }),
);

app.post(
    '/stop/:jobId',
    handleAsync(async (c) => {
        const jobId = c.req.param('jobId');
        const buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        if (!buildJob.deploymentId) {
            const err = new Error('No active deployment for this build');
            (err as any).status = 400;
            throw err;
        }

        await dockerService.stopDeployment(buildJob.deploymentId);

        return { jobId, status: 'stopped' };
    }),
);

app.post(
    '/restart/:jobId',
    handleAsync(async (c) => {
        const jobId = c.req.param('jobId');
        const buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        if (!buildJob.deploymentId) {
            const err = new Error('No active deployment for this build');
            (err as any).status = 400;
            throw err;
        }

        await dockerService.restartDeployment(buildJob.deploymentId);

        return { jobId, status: 'running' };
    }),
);

app.delete(
    '/:jobId',
    handleAsync(async (c) => {
        const jobId = c.req.param('jobId');
        const buildJob = buildJobStore.get(jobId);

        if (!buildJob) {
            const err = new Error('Build job not found');
            (err as any).status = 404;
            throw err;
        }

        if (buildJob.deploymentId) {
            await dockerService.deleteDeployment(buildJob.deploymentId);
        }

        await buildJobStore.delete(jobId);

        return { jobId, deleted: true };
    }),
);

export default app;
