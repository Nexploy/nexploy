import { Hono } from 'hono';
import dayjs from 'dayjs';
import fs from 'fs';
import yaml from 'yaml';
import { streamSSE } from 'hono/streaming';
import type { SSEStreamingApi } from 'hono/streaming';
import type { Context } from 'hono';
import { logger } from '@/utils/logger';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { buildDockerHostEnv, runDockerCompose } from '@/utils/compose/dockerComposeRunner';
import {
    cleanupEnvFile,
    cleanupGeneratedDockerfiles,
    cleanupProcessedComposeFile,
    findUnbuildableServices,
    parseCommandArgs,
    preprocessComposeProject,
    publishRemoteServicePorts,
    resolveBuiltImageReferences,
    writeEnvFile,
} from '@/utils/compose/composePhases';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import { TRAEFIK_NETWORK_NAME } from '@/lib/config';
import { networksStateManager } from '@/managers/list/networksStateManager';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

interface PhaseContext {
    sendLog: (message: string) => void;
    abortController: AbortController;
    dockerEnv: Record<string, string>;
    isRemoteEnvironment: boolean;
    environmentId: string | undefined;
    isDisconnected: () => boolean;
}

function runComposePhase(
    c: Context,
    eventPrefix: string,
    handler: (ctx: PhaseContext) => Promise<Record<string, unknown>>,
) {
    const environmentId = getCurrentEnvironmentId();

    return streamSSE(c, async (stream: SSEStreamingApi) => {
        let isClientDisconnected = false;
        const abortController = new AbortController();

        const envConfig = environmentId ? dockerClientRegistry.getEnvironmentConfig(environmentId) : null;
        const dockerEnvResult = buildDockerHostEnv(envConfig);

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
            abortController.abort();
        });

        const isDisconnected = () => isClientDisconnected || c.req.raw.signal.aborted;

        const sendLog = (message: string) => {
            if (isDisconnected()) return;
            try {
                stream.writeSSE({
                    data: JSON.stringify({
                        type: 'log',
                        message: message.trim(),
                        timestamp: dayjs().toISOString(),
                    }),
                    event: `${eventPrefix}-log`,
                });
            } catch {}
        };

        try {
            const result = await handler({
                sendLog,
                abortController,
                dockerEnv: dockerEnvResult.env,
                isRemoteEnvironment: envConfig?.connectionType === 'TCP' || envConfig?.connectionType === 'TCP_TLS',
                environmentId,
                isDisconnected,
            });

            if (!isDisconnected()) {
                await stream.writeSSE({
                    data: JSON.stringify({ type: 'complete', result, environmentId }),
                    event: `${eventPrefix}-complete`,
                });
            }

            await stream.close();
        } catch (error) {
            logger.error({ error, eventPrefix }, 'Compose phase failed');

            if (!isDisconnected()) {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: 'error',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }),
                        event: `${eventPrefix}-error`,
                    });
                } catch {}
            }

            await stream.close();
        } finally {
            dockerEnvResult.cleanup?.();
        }
    });
}

app.post('/stream/compose-build', async (c) => {
    const { workDir, projectName, composePath, envVars, labels, noCache, profiles } = await c.req.json<{
        workDir: string;
        projectName: string;
        composePath: string;
        envVars?: Record<string, string>;
        profiles?: string[];
        labels?: Record<string, string>;
        noCache?: boolean;
    }>();

    return runComposePhase(c, 'compose-build', async (ctx) => {
        const { sendLog, abortController, dockerEnv, isRemoteEnvironment } = ctx;
        const effectiveEnvVars: Record<string, string> = { ...(envVars || {}) };

        logger.info({ workDir, projectName, composePath }, 'Starting Docker Compose build phase');

        const {
            composeContent,
            composeDir,
            processedComposeFile,
            servicesToBuild,
            servicesToPull,
            volumeTransformResult,
        } = await preprocessComposeProject({
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

        try {
            if (servicesToPull.length > 0) {
                sendLog(`Pulling images for ${servicesToPull.length} service(s)...`);
                const failedPulls: { serviceName: string; error: string }[] = [];

                for (const serviceName of servicesToPull) {
                    if (abortController.signal.aborted) break;

                    sendLog(`Pulling image for service: ${serviceName}...`);
                    try {
                        const exitCode = await runDockerCompose(
                            ['-p', projectName, '-f', processedComposeFile, 'pull', serviceName],
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
                    ['-p', projectName, '-f', processedComposeFile, 'build', ...(noCache ? ['--no-cache'] : [])],
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
                // Reaching here means docker itself would reject the project, so report it
                // instead of completing successfully having built nothing.
                const serviceNames = Object.keys(composeContent.services || {});

                if (serviceNames.length === 0) {
                    throw new Error(
                        `No services found in ${composePath}. A compose file must declare at least one service under "services:".`,
                    );
                }

                for (const { serviceName, hint } of findUnbuildableServices(composeContent)) {
                    sendLog(`Service "${serviceName}" declares neither "build" nor "image"${hint ? ` — ${hint}` : ''}`);
                }

                throw new Error(
                    `Nothing to build or pull: none of the ${serviceNames.length} service(s) in ${composePath} ` +
                        `declares "build" or "image". docker compose rejects such a project with ` +
                        `"has neither an image nor a build context specified".`,
                );
            }

            if (isRemoteEnvironment) {
                sendLog('Ensuring container ports are published on remote host...');
                const portsAdded = await publishRemoteServicePorts(composeContent, sendLog);
                if (portsAdded) {
                    sendLog('Updated compose file with port mappings for remote environment');
                }
            }

            fs.writeFileSync(processedComposeFile, yaml.stringify(composeContent), 'utf8');
        } finally {
            if (volumeTransformResult) {
                cleanupGeneratedDockerfiles(composeDir, volumeTransformResult.generatedDockerfiles.keys());
            }
        }

        return {
            success: true,
            projectName,
            composeFile: processedComposeFile,
            services: Object.keys(composeContent.services || {}),
            builtServices: servicesToBuild,
            composeConfig: Buffer.from(yaml.stringify(composeContent)).toString('base64'),
        };
    });
});

app.post('/stream/compose-run', async (c) => {
    const { workDir, projectName, composeFile, service, command, envVars, noDeps, user, workingDir } =
        await c.req.json<{
            workDir: string;
            projectName: string;
            composeFile: string;
            service: string;
            command?: string;
            envVars?: Record<string, string>;
            noDeps?: boolean;
            user?: string;
            workingDir?: string;
        }>();

    return runComposePhase(c, 'compose-run', async (ctx) => {
        const { sendLog, abortController, dockerEnv } = ctx;

        if (!fs.existsSync(composeFile)) {
            throw new Error(`Compose file not found: ${composeFile}. Connect this node after a Compose Build node.`);
        }

        const composeContent = yaml.parse(fs.readFileSync(composeFile, 'utf8')) as ComposeContent;
        const knownServices = Object.keys(composeContent.services || {});
        if (!knownServices.includes(service)) {
            throw new Error(
                `Service "${service}" not found in compose file. Available services: ${knownServices.join(', ')}`,
            );
        }

        const commandArgs = command ? parseCommandArgs(command) : [];
        let envFileWritten = false;

        try {
            if (envVars && Object.keys(envVars).length > 0) {
                writeEnvFile(workDir, envVars);
                envFileWritten = true;
            }

            const runArgs = [
                '-p',
                projectName,
                '-f',
                composeFile,
                'run',
                '--rm',
                '-T',
                ...(noDeps ? ['--no-deps'] : []),
                ...(user ? ['--user', user] : []),
                ...(workingDir ? ['--workdir', workingDir] : []),
                service,
                ...commandArgs,
            ];

            sendLog(
                `Running one-off container for service "${service}"${
                    command ? `: ${command}` : ' (image default command)'
                }`,
            );

            const exitCode = await runDockerCompose(runArgs, workDir, dockerEnv, sendLog, abortController.signal);

            if (exitCode !== 0) {
                throw new Error(`docker compose run failed with exit code ${exitCode} (service: ${service})`);
            }

            sendLog('One-off command completed successfully (exit code 0)');

            return { success: true, exitCode, service, projectName, composeFile };
        } finally {
            if (envFileWritten) {
                cleanupEnvFile(workDir);
            }
        }
    });
});

app.post('/stream/compose-up', async (c) => {
    const { workDir, projectName, composeFile, envVars, recreate, removeOrphans, keepComposeFile } = await c.req.json<{
        workDir: string;
        projectName: string;
        composeFile: string;
        envVars?: Record<string, string>;
        recreate?: boolean;
        removeOrphans?: boolean;
        keepComposeFile?: boolean;
    }>();

    return runComposePhase(c, 'compose-up', async (ctx) => {
        const { sendLog, abortController, dockerEnv, isRemoteEnvironment } = ctx;

        if (!fs.existsSync(composeFile)) {
            throw new Error(`Compose file not found: ${composeFile}. Connect this node after a Compose Build node.`);
        }

        const composeContent = yaml.parse(fs.readFileSync(composeFile, 'utf8')) as ComposeContent;
        const orphanArgs = removeOrphans === false ? [] : ['--remove-orphans'];
        let envFileWritten = false;

        try {
            if (recreate !== false) {
                sendLog('Removing existing containers if any...');
                try {
                    const downCode = await runDockerCompose(
                        ['-p', projectName, '-f', composeFile, 'down', ...orphanArgs],
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
            }

            if (envVars && Object.keys(envVars).length > 0) {
                sendLog(`Writing ${Object.keys(envVars).length} environment variable(s) to .env file...`);
                writeEnvFile(workDir, envVars);
                envFileWritten = true;
                sendLog('Environment variables written successfully');
            }

            sendLog('Starting services...');
            const upCode = await runDockerCompose(
                ['-p', projectName, '-f', composeFile, 'up', '-d', ...orphanArgs],
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
            const containerIds = runningContainers.map((container) => container.Id);

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
                        await docker.getNetwork(TRAEFIK_NETWORK_NAME).connect({
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

            return {
                success: true,
                projectName,
                containers: containerIds,
                composeConfig: Buffer.from(yaml.stringify(composeContent)).toString('base64'),
            };
        } finally {
            if (envFileWritten) {
                cleanupEnvFile(workDir);
                logger.info({ workDir }, 'Cleaned up .env file after compose up');
            }

            if (!keepComposeFile) {
                cleanupProcessedComposeFile(composeFile);
            }
        }
    });
});

export default app;
