import { Job, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { deployerConfig } from '@/deployer/config';
import { logger } from '@/utils/logger';
import type { BuildConfig, BuildJob, BuildLogEntry, BuildStatus } from '@/deployer/types';
import { buildJobStore } from './store';
import { dockerService } from '@/deployer/docker/dockerService';
import { pipelineService } from '@/deployer/pipeline/pipelineService';

let connection: Redis | null = null;
let buildQueue: Queue<BuildConfig> | null = null;
let buildWorker: Worker<BuildConfig> | null = null;

async function addLog(job: BuildJob, level: BuildLogEntry['level'], step: string, message: string) {
    const logEntry: BuildLogEntry = {
        timestamp: new Date(),
        level,
        step,
        message,
    };
    job.updatedAt = new Date();
    await buildJobStore.addLog(job.id, logEntry);
    await buildJobStore.set(job.id, job);
    logger.info({ jobId: job.id, step }, message);
}

async function updateStatus(job: BuildJob, status: BuildStatus) {
    job.status = status;
    job.updatedAt = new Date();
    await buildJobStore.set(job.id, job);
}

export async function initBuildQueue(): Promise<void> {
    connection = new Redis({
        host: deployerConfig.redis.host,
        port: deployerConfig.redis.port,
        password: deployerConfig.redis.password,
        maxRetriesPerRequest: null,
        db: 0,
    });

    buildQueue = new Queue<BuildConfig>('build', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
        },
    });

    buildWorker = new Worker<BuildConfig>(
        'build',
        async (queueJob: Job<BuildConfig>) => {
            const buildJob = buildJobStore.get(queueJob.id!);
            if (!buildJob) {
                throw new Error(`Build job ${queueJob.id} not found in store`);
            }

            let workDir: string | null = null;

            try {
                // Step 1: Clone repository
                updateStatus(buildJob, 'cloning');
                addLog(buildJob, 'info', 'clone', `Cloning repository ${buildJob.config.gitUrl}`);
                workDir = await pipelineService.cloneRepository(buildJob.config);
                addLog(buildJob, 'info', 'clone', `Repository cloned to ${workDir}`);

                // Step 2: Generate/copy Dockerfile
                addLog(buildJob, 'info', 'dockerfile', 'Preparing Dockerfile');
                await pipelineService.prepareDockerfile(workDir, buildJob.config);
                addLog(buildJob, 'info', 'dockerfile', 'Dockerfile ready');

                // Step 3: Write env file
                if (Object.keys(buildJob.config.envVariables).length > 0) {
                    addLog(buildJob, 'info', 'env', 'Writing environment variables');
                    await pipelineService.writeEnvFile(workDir, buildJob.config.envVariables);
                    addLog(buildJob, 'info', 'env', 'Environment file written');
                }

                // Step 4: Build Docker image
                updateStatus(buildJob, 'building');
                const imageName = dockerService.getLocalImageName(buildJob.config);
                addLog(buildJob, 'info', 'build', `Building Docker image: ${imageName}`);

                const buildResult = await dockerService.buildImage(workDir, imageName, (log) => {
                    addLog(buildJob, 'debug', 'build', log);
                });

                buildJob.imageId = buildResult.imageId;
                addLog(buildJob, 'info', 'build', 'Docker image built successfully');

                // Step 5: Deploy locally if autoDeploy is enabled
                if (buildJob.config.autoDeploy !== false) {
                    updateStatus(buildJob, 'deploying');
                    addLog(buildJob, 'info', 'deploy', 'Starting local deployment');

                    const deployResult = await dockerService.deploy(
                        buildJob.config.projectId,
                        imageName,
                        {
                            port: buildJob.config.port || 3000,
                            envVars: buildJob.config.envVariables,
                        },
                    );

                    buildJob.deploymentId = deployResult.deploymentId;
                    buildJob.containerId = deployResult.containerId;
                    buildJob.port = deployResult.port;

                    addLog(
                        buildJob,
                        'info',
                        'deploy',
                        `Deployed on port ${deployResult.port} (container: ${deployResult.containerId.slice(0, 12)})`,
                    );
                }

                // Cleanup work directory
                if (workDir) {
                    await pipelineService.cleanup(workDir);
                }

                // Mark as completed
                updateStatus(buildJob, 'completed');
                buildJob.completedAt = new Date();
                addLog(buildJob, 'info', 'complete', 'Build pipeline completed successfully');

                return {
                    success: true,
                    imageId: buildJob.imageId,
                    deploymentId: buildJob.deploymentId,
                    port: buildJob.port,
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                buildJob.error = errorMessage;
                updateStatus(buildJob, 'failed');
                addLog(buildJob, 'error', 'error', `Build failed: ${errorMessage}`);

                if (workDir) {
                    await pipelineService.cleanup(workDir).catch(() => {});
                }

                throw error;
            }
        },
        {
            connection,
            concurrency: 2,
        },
    );

    buildWorker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'Build job completed');
    });

    buildWorker.on('failed', (job, error) => {
        logger.error({ jobId: job?.id, error: error.message }, 'Build job failed');
    });

    logger.info('Build queue initialized');
}

export async function addBuildJob(jobId: string, config: BuildConfig): Promise<void> {
    if (!buildQueue) {
        throw new Error('Build queue not initialized');
    }
    await buildQueue.add('build', config, { jobId });
}

export async function closeBuildQueue(): Promise<void> {
    if (buildWorker) {
        await buildWorker.close();
    }
    if (buildQueue) {
        await buildQueue.close();
    }
    if (connection) {
        await connection.quit();
    }
    logger.info('Build queue closed');
}
