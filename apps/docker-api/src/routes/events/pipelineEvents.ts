import { Hono } from 'hono';
import dayjs from 'dayjs';
import { getImagesStateManager } from '@/managers/list/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { buildDockerHostEnv, runDockerCompose } from '@/utils/compose/dockerComposeRunner';
import fs from 'fs';
import yaml from 'yaml';
import {
    cleanupEnvFile,
    cleanupGeneratedDockerfiles,
    cleanupProcessedComposeFile,
    findUnbuildableServices,
    preprocessComposeProject,
    publishRemoteServicePorts,
    resolveBuiltImageReferences,
    writeEnvFile,
} from '@/utils/compose/composePhases';
import type { VolumeTransformationResult } from '@workspace/typescript-interface/docker/docker.compose.volume';
import { TRAEFIK_NETWORK_NAME } from '@/lib/config';
import { networksStateManager } from '@/managers/list/networksStateManager';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

app.post('/stream/compose', async (c) => {
    const { workDir, projectName, composePath, envVars, labels, noCache, profiles } = await c.req.json<{
        workDir: string;
        projectName: string;
        composePath: string;
        envVars?: Record<string, string>;
        profiles?: string[];
        buildId?: string;
        repositoryId?: string;
        labels?: Record<string, string>;
        noCache?: boolean;
    }>();

    const environmentId = getCurrentEnvironmentId();

    return streamSSE(c, async (stream) => {
        let isClientDisconnected = false;
        let envFileWritten = false;
        let modifiedComposeFile: string | null = null;
        let volumeTransformResult: VolumeTransformationResult | null = null;
        let composeDir: string = workDir;
        const abortController = new AbortController();

        const envConfig = environmentId ? dockerClientRegistry.getEnvironmentConfig(environmentId) : null;
        const dockerEnvResult = buildDockerHostEnv(envConfig);
        const dockerEnv = dockerEnvResult.env;

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
            abortController.abort();
        });

        const sendLog = (message: string) => {
            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                try {
                    stream.writeSSE({
                        data: JSON.stringify({
                            type: 'log',
                            message: message.trim(),
                            timestamp: dayjs().toISOString(),
                        }),
                        event: 'compose-log',
                    });
                } catch (e) {}
            }
        };

        try {
            logger.info(
                { workDir, projectName, composePath, environmentId, hasEnvVars: !!envVars },
                'Starting Docker Compose deployment',
            );

            const effectiveEnvVars: Record<string, string> = { ...(envVars || {}) };
            const isRemoteEnvironment = envConfig?.connectionType === 'TCP' || envConfig?.connectionType === 'TCP_TLS';

            const preprocessed = await preprocessComposeProject({
                workDir,
                projectName,
                composePath,
                envVars: effectiveEnvVars,
                dockerEnv,
                labels,
                profiles,
                isRemoteEnvironment,
                sendLog,
                signal: abortController.signal,
            });

            const composeContent = preprocessed.composeContent;
            const servicesToBuild = preprocessed.servicesToBuild;
            const servicesToPull = preprocessed.servicesToPull;

            composeDir = preprocessed.composeDir;
            envFileWritten = envFileWritten || Object.keys(effectiveEnvVars).length > 0;
            volumeTransformResult = preprocessed.volumeTransformResult;
            modifiedComposeFile = preprocessed.processedComposeFile;

            const activeComposeFile = modifiedComposeFile;

            if (servicesToPull.length > 0) {
                sendLog(`Pulling images for ${servicesToPull.length} service(s)...`);

                const failedPulls: { serviceName: string; error: string }[] = [];

                for (const serviceName of servicesToPull) {
                    if (abortController.signal.aborted) break;

                    sendLog(`Pulling image for service: ${serviceName}...`);
                    try {
                        const exitCode = await runDockerCompose(
                            ['-p', projectName, '-f', activeComposeFile, 'pull', serviceName],
                            workDir,
                            dockerEnv,
                            sendLog,
                            abortController.signal,
                        );
                        if (exitCode !== 0) {
                            throw new Error(`docker compose pull exited with code ${exitCode}`);
                        }
                    } catch (pullError) {
                        const errorMsg = pullError instanceof Error ? pullError.message : 'Unknown error';
                        sendLog(`Failed to pull image for service "${serviceName}": ${errorMsg}`);
                        failedPulls.push({ serviceName, error: errorMsg });
                    }
                }

                if (failedPulls.length > 0) {
                    const failedList = failedPulls.map((f) => `${f.serviceName}: ${f.error}`).join(', ');
                    throw new Error(
                        `Failed to pull required images: ${failedList}. Check that the image names and tags are correct.`,
                    );
                }

                sendLog('Images pulled successfully');
            }

            if (servicesToBuild.length > 0) {
                sendLog(`Building ${servicesToBuild.length} service(s): ${servicesToBuild.join(', ')}`);
                const buildCode = await runDockerCompose(
                    ['-p', projectName, '-f', activeComposeFile, 'build', ...(noCache ? ['--no-cache'] : [])],
                    workDir,
                    dockerEnv,
                    sendLog,
                    abortController.signal,
                );
                if (buildCode !== 0) {
                    throw new Error(`docker compose build failed with exit code ${buildCode}`);
                }
                sendLog('All services built successfully');

                try {
                    const pruneResult = await docker.pruneImages({
                        filters: { dangling: { true: true } },
                    });
                    const reclaimed = pruneResult.SpaceReclaimed || 0;
                    if (reclaimed > 0) {
                        sendLog(`Pruned dangling images (reclaimed ${(reclaimed / 1024 / 1024).toFixed(1)} MB)`);
                    }
                } catch (pruneErr) {
                    logger.warn({ error: pruneErr }, 'Failed to prune dangling images after compose build');
                }

                sendLog('Resolving built image references...');
                resolveBuiltImageReferences(composeContent, projectName, servicesToBuild, sendLog);
            } else if (servicesToPull.length === 0) {
                for (const { serviceName, hint } of findUnbuildableServices(composeContent)) {
                    sendLog(`Service "${serviceName}" declares neither "build" nor "image"${hint ? ` — ${hint}` : ''}`);
                }
                sendLog('No images to pull or build');
            }

            if (isRemoteEnvironment) {
                sendLog('Ensuring container ports are published on remote host...');
                const portsAdded = await publishRemoteServicePorts(composeContent, sendLog);
                if (portsAdded) {
                    sendLog('Updated compose file with port mappings for remote environment');
                }
            }

            fs.writeFileSync(modifiedComposeFile, yaml.stringify(composeContent), 'utf8');

            const deployComposeFile = modifiedComposeFile;

            sendLog('Removing existing containers if any...');
            try {
                const downCode = await runDockerCompose(
                    ['-p', projectName, '-f', deployComposeFile, 'down', '--remove-orphans'],
                    workDir,
                    dockerEnv,
                    sendLog,
                );
                if (downCode === 0) {
                    sendLog('Existing containers removed');
                }
            } catch {
                sendLog('No existing containers to remove from project');
            }

            if (Object.keys(effectiveEnvVars).length > 0) {
                sendLog(`Writing ${Object.keys(effectiveEnvVars).length} environment variable(s) to .env file...`);
                writeEnvFile(composeDir, effectiveEnvVars);
                envFileWritten = true;
                sendLog('Environment variables written successfully');
            }

            sendLog('Starting services...');
            const upCode = await runDockerCompose(
                ['-p', projectName, '-f', deployComposeFile, 'up', '-d', '--remove-orphans'],
                workDir,
                dockerEnv,
                sendLog,
                abortController.signal,
            );
            if (upCode !== 0) {
                throw new Error(`docker compose up failed with exit code ${upCode}`);
            }
            sendLog('Services started successfully');

            const runningContainers = await docker.listContainers({
                all: true,
                filters: { label: [`com.docker.compose.project=${projectName}`] },
            });
            const containerIds = runningContainers.map((c) => c.Id);

            if (isRemoteEnvironment) {
                sendLog('Remote environment: routing via published host ports (skipping Traefik network attach)');
            } else {
                try {
                    await networksStateManager.createNetworkIfMissing(TRAEFIK_NETWORK_NAME);
                } catch (e) {
                    const reason = e instanceof Error ? e.message : String(e);
                    sendLog(`Warning: Could not provision Traefik network: ${reason}`);
                }

                sendLog(`Connecting ${containerIds.length} containers to Traefik network...`);
                for (const containerId of containerIds) {
                    try {
                        const network = docker.getNetwork(TRAEFIK_NETWORK_NAME);
                        await network.connect({
                            Container: containerId,
                        });
                        sendLog(`Container ${containerId} connected to Traefik network`);
                    } catch (e) {
                        const reason = e instanceof Error ? e.message : String(e);
                        if (/already exists|already connected/i.test(reason)) {
                            sendLog(`Container ${containerId} already connected to Traefik network`);
                        } else {
                            sendLog(
                                `Warning: Could not connect container ${containerId} to Traefik network: ${reason}`,
                            );
                        }
                    }
                }
            }

            const composeConfigB64 = Buffer.from(yaml.stringify(composeContent)).toString('base64');
            const result = {
                success: true,
                containers: containerIds,
                composeConfig: composeConfigB64,
            };

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'complete',
                        result,
                        environmentId,
                    }),
                    event: 'compose-complete',
                });
            }

            await stream.close();
        } catch (error) {
            logger.error({ error, workDir, projectName }, 'Docker Compose deployment failed');

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: 'error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                        event: 'compose-error',
                    });
                } catch (e) {}
            }

            await stream.close();
        } finally {
            dockerEnvResult.cleanup?.();

            if (envFileWritten) {
                cleanupEnvFile(composeDir);
                logger.info({ composeDir }, 'Cleaned up .env file after compose deployment');
            }

            if (modifiedComposeFile) {
                cleanupProcessedComposeFile(modifiedComposeFile);
            }

            if (volumeTransformResult) {
                cleanupGeneratedDockerfiles(composeDir, volumeTransformResult.generatedDockerfiles.keys());
            }
        }
    });
});

app.post('/stream/build', async (c) => {
    const { workDir, imageName, dockerfilePath, labels } = await c.req.json<{
        workDir: string;
        imageName: string;
        dockerfilePath?: string;
        labels?: Record<string, string>;
    }>();

    const manager = getImagesStateManager();

    return streamSSE(c, async (stream) => {
        const abortController = new AbortController();
        let isClientDisconnected = false;

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
            abortController.abort();
        });

        try {
            const onLog = (log: string) => {
                if (isClientDisconnected || c.req.raw.signal.aborted) {
                    return;
                }

                try {
                    stream.writeSSE({
                        data: JSON.stringify({
                            type: 'log',
                            message: log,
                            timestamp: dayjs().toISOString(),
                        }),
                        event: 'build-log',
                    });
                } catch (e) {}
            };

            const result = await manager.buildImage(
                workDir,
                imageName,
                dockerfilePath,
                onLog,
                abortController.signal,
                labels,
            );

            try {
                const pruneResult = await docker.pruneImages({
                    filters: { dangling: { true: true } },
                });
                const reclaimed = pruneResult.SpaceReclaimed || 0;
                if (reclaimed > 0) {
                    onLog(`Pruned dangling images (reclaimed ${(reclaimed / 1024 / 1024).toFixed(1)} MB)`);
                }
            } catch (pruneErr) {
                logger.warn({ error: pruneErr }, 'Failed to prune dangling images after dockerfile build');
            }

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'complete',
                        result,
                    }),
                    event: 'build-complete',
                });
            }

            await stream.close();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                await stream.close();
                return;
            }

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: 'error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                        event: 'build-error',
                    });
                } catch (e) {}
            }

            await stream.close();
        }
    });
});

app.post('/stream/push', async (c) => {
    const { imageName, targetName, auth } = await c.req.json<{
        imageName: string;
        targetName: string;
        auth: { serveraddress: string; username: string; password: string };
    }>();

    const manager = getImagesStateManager();

    return streamSSE(c, async (stream) => {
        const abortController = new AbortController();
        let isClientDisconnected = false;

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
            abortController.abort();
        });

        try {
            const onLog = (log: string) => {
                if (isClientDisconnected || c.req.raw.signal.aborted) {
                    return;
                }

                try {
                    stream.writeSSE({
                        data: JSON.stringify({
                            type: 'log',
                            message: log,
                            timestamp: dayjs().toISOString(),
                        }),
                        event: 'push-log',
                    });
                } catch (e) {}
            };

            const result = await manager.pushImage(imageName, targetName, auth, onLog, abortController.signal);

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'complete',
                        result,
                    }),
                    event: 'push-complete',
                });
            }

            await stream.close();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                await stream.close();
                return;
            }

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: 'error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                        event: 'push-error',
                    });
                } catch (e) {}
            }

            await stream.close();
        }
    });
});

export default app;
