import { Hono } from 'hono';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import {
    buildDockerHostEnv,
    getComposeContainerIds,
    runDockerCompose,
} from '@/utils/dockerComposeRunner';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { findUnresolvedVariables, substituteEnvVars } from '@/utils/composePreprocessor';
import {
    getExplicitContainerNames,
    getServicesToPull,
    parseComposeBuildConfigs,
} from '@/utils/composeBuildParser';
import { buildComposeServices, cleanupPartialBuild } from '@/utils/composeBuildService';
import {
    getTransformationSummary,
    transformBindMountsForRemote,
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
    const { workDir, projectName, composePath, envVars, buildId, repositoryId, labels } =
        await c.req.json<{
            workDir: string;
            projectName: string;
            composePath?: string;
            envVars?: Record<string, string>;
            buildId?: string;
            repositoryId?: string;
            labels?: Record<string, string>;
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

        const envConfig = environmentId
            ? dockerClientRegistry.getEnvironmentConfig(environmentId)
            : null;
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

            const unresolvedVars = findUnresolvedVariables(composeYamlContent);
            if (unresolvedVars.length > 0) {
                sendLog(
                    `WARNING: Unresolved variables in compose file: ${unresolvedVars.map((v) => `$\{${v}}`).join(', ')}`,
                );
            }

            let composeContent = yaml.parse(composeYamlContent) as ComposeContent;

            const isRemoteEnvironment =
                envConfig?.connectionType === 'TCP' || envConfig?.connectionType === 'TCP_TLS';

            if (isRemoteEnvironment) {
                sendLog('Remote Docker environment detected - transforming bind mounts...');

                const initialBuildConfigs = parseComposeBuildConfigs(
                    composeContent,
                    projectName,
                    workDir,
                    buildId,
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

                for (const [
                    serviceName,
                    dockerfileContent,
                ] of volumeTransformResult.generatedDockerfiles) {
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
                            const errorMessage = err instanceof Error ? err.message : String(err);
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

            const buildConfigs = parseComposeBuildConfigs(
                composeContent,
                projectName,
                workDir,
                buildId,
            );
            const servicesToPull = getServicesToPull(composeContent);

            if (servicesToPull.length > 0) {
                sendLog(`Pulling images for ${servicesToPull.length} service(s)...`);

                const failedPulls: { serviceName: string; error: string }[] = [];

                for (const serviceName of servicesToPull) {
                    if (abortController.signal.aborted) break;

                    sendLog(`Pulling image for service: ${serviceName}...`);
                    try {
                        const exitCode = await runDockerCompose(
                            ['-p', projectName, '-f', composeFilePath, 'pull', serviceName],
                            workDir,
                            dockerEnv,
                            sendLog,
                            abortController.signal,
                        );
                        if (exitCode !== 0) {
                            throw new Error(`docker compose pull exited with code ${exitCode}`);
                        }
                    } catch (pullError) {
                        const errorMsg =
                            pullError instanceof Error ? pullError.message : 'Unknown error';
                        sendLog(`Failed to pull image for service "${serviceName}": ${errorMsg}`);
                        failedPulls.push({ serviceName, error: errorMsg });
                    }
                }

                if (failedPulls.length > 0) {
                    const failedList = failedPulls
                        .map((f) => `${f.serviceName}: ${f.error}`)
                        .join(', ');
                    throw new Error(
                        `Failed to pull required images: ${failedList}. Check that the image names and tags are correct.`,
                    );
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
                    labels,
                );

                sendLog('All services built successfully');

                try {
                    const pruneResult = await dockerClient.pruneImages({
                        filters: { dangling: { true: true } },
                    });
                    const reclaimed = pruneResult.SpaceReclaimed || 0;
                    if (reclaimed > 0) {
                        sendLog(
                            `Pruned dangling images (reclaimed ${(reclaimed / 1024 / 1024).toFixed(1)} MB)`,
                        );
                    }
                } catch (pruneErr) {
                    logger.warn(
                        { error: pruneErr },
                        'Failed to prune dangling images after compose build',
                    );
                }

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

            if (isRemoteEnvironment) {
                let portsAdded = false;
                sendLog('Ensuring container ports are published on remote host...');
                for (const [serviceName, service] of Object.entries(
                    composeContent.services || {},
                )) {
                    const servicePorts = service.ports as string[] | undefined;
                    if (!servicePorts || servicePorts.length === 0) {
                        const imageName = service.image;
                        if (imageName) {
                            try {
                                const imageInfo = await dockerClient.getImage(imageName).inspect();
                                const exposedPorts = Object.keys(
                                    imageInfo.Config?.ExposedPorts || {},
                                );
                                if (exposedPorts.length > 0) {
                                    const portMappings = exposedPorts.map((p) => {
                                        const port = p.split('/')[0];
                                        return `0:${port}`;
                                    });
                                    (service as Record<string, unknown>).ports = portMappings;
                                    sendLog(
                                        `  Added port mappings for service ${serviceName}: ${portMappings.join(', ')}`,
                                    );
                                    portsAdded = true;
                                }
                            } catch {
                                sendLog(
                                    `  Warning: Could not inspect image for service ${serviceName} to determine ports`,
                                );
                            }
                        }
                    }
                }

                if (portsAdded) {
                    modifiedComposeFile =
                        modifiedComposeFile || path.join(workDir, '.nexploy-compose-processed.yml');
                    fs.writeFileSync(modifiedComposeFile, yaml.stringify(composeContent), 'utf8');
                    sendLog('Updated compose file with port mappings for remote environment');
                }
            }

            const deployComposeFile = modifiedComposeFile || composeFilePath;

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

            if (composeContent.networks) {
                for (const networkName of Object.keys(composeContent.networks)) {
                    const fullNetworkName = `${projectName}_${networkName}`;
                    try {
                        const network = dockerClient.getNetwork(fullNetworkName);
                        const networkInfo = await network.inspect();

                        const connectedContainers = networkInfo.Containers || {};
                        for (const containerId of Object.keys(connectedContainers)) {
                            try {
                                await network.disconnect({ Container: containerId, Force: true });
                            } catch {}
                        }

                        await network.remove();
                        sendLog(`Removed existing network: ${fullNetworkName}`);
                    } catch {}
                }
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

            const containerIds = await getComposeContainerIds(
                projectName,
                deployComposeFile,
                workDir,
                dockerEnv,
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
            dockerEnvResult.cleanup?.();

            if (envFileWritten) {
                cleanupEnvFile(workDir);
                logger.info({ workDir }, 'Cleaned up .env file after compose deployment');
            }

            if (modifiedComposeFile && fs.existsSync(modifiedComposeFile)) {
                try {
                    fs.unlinkSync(modifiedComposeFile);
                    logger.info({ path: modifiedComposeFile }, 'Cleaned up temporary compose file');
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
                            timestamp: new Date().toISOString(),
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
                const dockerClient = getCurrentDockerClient();
                const pruneResult = await dockerClient.pruneImages({
                    filters: { dangling: { true: true } },
                });
                const reclaimed = pruneResult.SpaceReclaimed || 0;
                if (reclaimed > 0) {
                    onLog(
                        `Pruned dangling images (reclaimed ${(reclaimed / 1024 / 1024).toFixed(1)} MB)`,
                    );
                }
            } catch (pruneErr) {
                logger.warn(
                    { error: pruneErr },
                    'Failed to prune dangling images after dockerfile build',
                );
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

export default app;
