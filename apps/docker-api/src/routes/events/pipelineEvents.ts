import { Hono } from 'hono';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import DockerodeCompose from 'dockerode-compose';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import type { Readable } from 'stream';
import { substituteEnvVars } from '@/utils/composePreprocessor';
import {
    parseComposeBuildConfigs,
    getServicesToPull,
    getExplicitContainerNames,
} from '@/utils/composeBuildParser';
import { buildComposeServices, cleanupPartialBuild } from '@/utils/composeBuildService';
import {
    transformBindMountsForRemote,
    getTransformationSummary,
} from '@/utils/composeVolumeTransformer';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import type { VolumeTransformationResult } from '@workspace/typescript-interface/docker/docker.compose.volume';

const app = new Hono();

function writeEnvFile(workDir: string, envVars: Record<string, string>): string {
    const envFilePath = path.join(workDir, '.env');
    const envContent = Object.entries(envVars)
        .map(([key, value]) => {
            const escapedValue =
                value.includes('\n') || value.includes('"') || value.includes("'")
                    ? `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
                    : value;
            return `${key}=${escapedValue}`;
        })
        .join('\n');

    fs.writeFileSync(envFilePath, envContent, 'utf8');
    return envFilePath;
}

function cleanupEnvFile(workDir: string): void {
    const envFilePath = path.join(workDir, '.env');
    try {
        if (fs.existsSync(envFilePath)) {
            fs.unlinkSync(envFilePath);
        }
    } catch (error) {
        logger.warn({ error, envFilePath }, 'Failed to cleanup .env file');
    }
}

app.post('/stream/compose', async (c) => {
    const { workDir, projectName, composePath, envVars } = await c.req.json<{
        workDir: string;
        projectName: string;
        composePath?: string;
        envVars?: Record<string, string>;
    }>();

    const dockerClient = getCurrentDockerClient();
    const environmentId = getCurrentEnvironmentId();

    return streamSSE(c, async (stream) => {
        let isClientDisconnected = false;
        let envFileWritten = false;
        let modifiedComposeFile: string | null = null;
        let volumeTransformResult: VolumeTransformationResult | null = null;
        const builtImageNames: string[] = [];
        const abortController = new AbortController();

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
                            timestamp: new Date().toISOString(),
                        }),
                        event: 'compose-log',
                    });
                } catch (e) {}
            }
        };

        try {
            const composeFile = composePath || 'docker-compose.yml';
            const composeFilePath = path.join(workDir, composeFile);

            logger.info(
                { workDir, projectName, composeFile, environmentId, hasEnvVars: !!envVars },
                'Starting Docker Compose deployment',
            );

            if (envVars && Object.keys(envVars).length > 0) {
                sendLog(
                    `Writing ${Object.keys(envVars).length} environment variable(s) to .env file...`,
                );
                writeEnvFile(workDir, envVars);
                envFileWritten = true;
                sendLog('Environment variables written successfully');
            }

            let composeYamlContent = fs.readFileSync(composeFilePath, 'utf8');
            if (envVars && Object.keys(envVars).length > 0) {
                composeYamlContent = substituteEnvVars(composeYamlContent, envVars);
            }

            let composeContent = yaml.parse(composeYamlContent) as ComposeContent;

            const envConfig = environmentId
                ? dockerClientRegistry.getEnvironmentConfig(environmentId)
                : null;
            const isRemoteEnvironment =
                envConfig?.connectionType === 'TCP' || envConfig?.connectionType === 'TCP_TLS';

            if (isRemoteEnvironment) {
                sendLog('Remote Docker environment detected - transforming bind mounts...');

                const initialBuildConfigs = parseComposeBuildConfigs(
                    composeContent,
                    projectName,
                    workDir,
                );
                volumeTransformResult = transformBindMountsForRemote(
                    composeContent,
                    workDir,
                    projectName,
                    initialBuildConfigs,
                );

                for (const warning of volumeTransformResult.warnings) {
                    sendLog(`WARNING: ${warning}`);
                }

                const summary = getTransformationSummary(volumeTransformResult);
                for (const line of summary) {
                    sendLog(line);
                }

                composeContent = volumeTransformResult.modifiedComposeContent as ComposeContent;

                for (const [serviceName, dockerfileContent] of volumeTransformResult.generatedDockerfiles) {
                    const dockerfilePath = path.join(workDir, `.nexploy-${serviceName}.Dockerfile`);
                    fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
                    sendLog(`Generated Dockerfile for service: ${serviceName}`);
                }

                if (volumeTransformResult.volumesToCreate.length > 0) {
                    sendLog(
                        `Creating ${volumeTransformResult.volumesToCreate.length} named volume(s)...`,
                    );
                    for (const volumeName of volumeTransformResult.volumesToCreate) {
                        try {
                            await dockerClient.createVolume({ Name: volumeName });
                            sendLog(`  Created volume: ${volumeName}`);
                        } catch (err: unknown) {
                            const errorMessage =
                                err instanceof Error ? err.message : String(err);
                            if (!errorMessage.includes('already exists')) {
                                throw err;
                            }
                            sendLog(`  Volume exists: ${volumeName}`);
                        }
                    }
                }

                if (volumeTransformResult.transformations.length > 0) {
                    sendLog('Bind mount transformation complete');
                }
            }

            const buildConfigs = parseComposeBuildConfigs(composeContent, projectName, workDir);
            const servicesToPull = getServicesToPull(composeContent);

            const initialCompose = new DockerodeCompose(
                dockerClient,
                composeFilePath,
                projectName,
            );

            if (servicesToPull.length > 0) {
                sendLog(`Pulling images for ${servicesToPull.length} service(s)...`);

                for (const serviceName of servicesToPull) {
                    if (abortController.signal.aborted) break;

                    try {
                        const pullStreams = await initialCompose.pull(serviceName, {
                            streams: true,
                            verbose: false,
                        });

                        if (Array.isArray(pullStreams)) {
                            for (const pullStream of pullStreams) {
                                if (pullStream && typeof pullStream.on === 'function') {
                                    await new Promise<void>((resolvePull, rejectPull) => {
                                        const readable = pullStream as Readable;

                                        readable.on('data', (chunk) => {
                                            if (
                                                isClientDisconnected ||
                                                c.req.raw.signal.aborted
                                            ) {
                                                readable.destroy();
                                                return;
                                            }

                                            try {
                                                const data = JSON.parse(chunk.toString());
                                                let message = '';

                                                if (data.status) {
                                                    message = data.status;
                                                    if (data.id) {
                                                        message = `[${data.id}] ${message}`;
                                                    }
                                                    if (data.progress) {
                                                        message += ` ${data.progress}`;
                                                    }
                                                }

                                                if (message) {
                                                    sendLog(message);
                                                }
                                            } catch (parseError) {
                                                sendLog(chunk.toString());
                                            }
                                        });

                                        readable.on('end', () => resolvePull());
                                        readable.on('error', (err) => {
                                            sendLog(`Pull error: ${err.message}`);
                                            rejectPull(err);
                                        });
                                    });
                                }
                            }
                        }
                    } catch (pullError) {
                        sendLog(
                            `Warning: Failed to pull image for ${serviceName}: ${pullError instanceof Error ? pullError.message : 'Unknown error'}`,
                        );
                    }
                }
                sendLog('Images pulled successfully');
            } else if (buildConfigs.length === 0) {
                sendLog('No images to pull or build');
            }

            if (buildConfigs.length > 0) {
                sendLog(
                    `Building ${buildConfigs.length} service(s) via Docker API: ${buildConfigs.map((c) => c.serviceName).join(', ')}`,
                );

                await buildComposeServices(
                    dockerClient,
                    buildConfigs,
                    (progress) => {
                        if (progress.message) {
                            sendLog(`[${progress.serviceName}] ${progress.message}`);
                        }
                        if (progress.type === 'complete' && progress.imageId) {
                            builtImageNames.push(progress.imageId);
                        }
                    },
                    abortController.signal,
                );

                sendLog('All services built successfully');

                for (const config of buildConfigs) {
                    const service = composeContent.services?.[config.serviceName];
                    if (service) {
                        service.image = config.imageName;
                        delete service.build;
                    }
                }

                modifiedComposeFile = path.join(workDir, '.nexploy-compose-processed.yml');
                fs.writeFileSync(modifiedComposeFile, yaml.stringify(composeContent), 'utf8');
                sendLog('Created processed compose file for deployment');
            }

            const deployComposeFile = modifiedComposeFile || composeFilePath;
            const compose = new DockerodeCompose(dockerClient, deployComposeFile, projectName);

            sendLog('Removing existing containers if any...');
            try {
                await compose.down({ volumes: false });
                sendLog('Existing containers removed');
            } catch (downError) {
                sendLog('No existing containers to remove from project');
            }

            const containerNames = getExplicitContainerNames(composeContent);

            for (const containerName of containerNames) {
                try {
                    const container = dockerClient.getContainer(containerName);
                    const info = await container.inspect();
                    sendLog(`Stopping existing container: ${containerName}`);
                    if (info.State.Running) {
                        await container.stop();
                    }
                    await container.remove({ force: true });
                    sendLog(`Removed existing container: ${containerName}`);
                } catch (removeError) {}
            }

            sendLog('Starting services...');
            const upResult = await compose.up({ verbose: true });
            sendLog('Services started successfully');

            const containerIds = upResult.services.map(
                (container: { id: string }) => container.id,
            );

            sendLog(`Connecting ${containerIds.length} containers to Traefik network...`);
            for (const containerId of containerIds) {
                try {
                    const network = dockerClient.getNetwork('nexploy_traefik_network');
                    await network.connect({
                        Container: containerId,
                    });
                    sendLog(
                        `Container ${containerId.substring(0, 12)} connected to Traefik network`,
                    );
                } catch (e) {
                    sendLog(
                        `Warning: Could not connect container ${containerId.substring(0, 12)} to Traefik network`,
                    );
                }
            }

            const result = { success: true, containers: containerIds };

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

            if (builtImageNames.length > 0) {
                sendLog('Cleaning up partially built images...');
                await cleanupPartialBuild(dockerClient, builtImageNames);
            }

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
            if (envFileWritten) {
                cleanupEnvFile(workDir);
                logger.info({ workDir }, 'Cleaned up .env file after compose deployment');
            }

            if (modifiedComposeFile && fs.existsSync(modifiedComposeFile)) {
                try {
                    fs.unlinkSync(modifiedComposeFile);
                    logger.info(
                        { path: modifiedComposeFile },
                        'Cleaned up temporary compose file',
                    );
                } catch (e) {
                    logger.warn(
                        { path: modifiedComposeFile, error: e },
                        'Failed to cleanup temporary compose file',
                    );
                }
            }

            if (volumeTransformResult) {
                for (const serviceName of volumeTransformResult.generatedDockerfiles.keys()) {
                    const dockerfilePath = path.join(workDir, `.nexploy-${serviceName}.Dockerfile`);
                    try {
                        if (fs.existsSync(dockerfilePath)) {
                            fs.unlinkSync(dockerfilePath);
                            logger.info(
                                { path: dockerfilePath },
                                'Cleaned up generated Dockerfile',
                            );
                        }
                    } catch (e) {
                        logger.warn(
                            { path: dockerfilePath, error: e },
                            'Failed to cleanup generated Dockerfile',
                        );
                    }
                }
            }
        }
    });
});

app.post('/stream/build', async (c) => {
    const { workDir, imageName } = await c.req.json<{
        workDir: string;
        imageName: string;
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
                            timestamp: new Date().toISOString(),
                        }),
                        event: 'build-log',
                    });
                } catch (e) {}
            };

            const result = await manager.buildImage(
                workDir,
                imageName,
                onLog,
                abortController.signal,
            );

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

export default app;
