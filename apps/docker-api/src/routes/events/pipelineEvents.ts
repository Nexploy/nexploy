import { Hono } from 'hono';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import DockerodeCompose from 'dockerode-compose';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import type { Readable } from 'stream';

const app = new Hono();

app.post('/stream/compose', async (c) => {
    const { workDir, projectName, composePath, envVars } = await c.req.json<{
        workDir: string;
        projectName: string;
        composePath?: string;
        envVars?: Record<string, string>;
    }>();

    const dockerClient = getCurrentDockerClient();

    return streamSSE(c, async (stream) => {
        let isClientDisconnected = false;

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
        });

        try {
            const composeFile = composePath || 'docker-compose.yml';
            const composeFilePath = path.join(workDir, composeFile);

            logger.info(
                { workDir, projectName, composeFile },
                'Starting Docker Compose deployment',
            );

            const compose = new DockerodeCompose(dockerClient, composeFilePath, projectName);

            const result = await new Promise<{ success: boolean; containers?: string[] }>(
                async (resolve, reject) => {
                    try {
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

                        // Parse compose file to check which services need pulling vs building
                        const composeContent = yaml.parse(
                            fs.readFileSync(composeFilePath, 'utf8'),
                        ) as { services?: Record<string, { image?: string; build?: unknown }> };

                        const servicesToPull = Object.entries(composeContent.services || {})
                            .filter(([, service]) => service.image && !service.build)
                            .map(([name]) => name);

                        if (servicesToPull.length > 0) {
                            sendLog(`Pulling images for ${servicesToPull.length} service(s)...`);

                            for (const serviceName of servicesToPull) {
                                try {
                                    const pullStreams = await compose.pull(serviceName, {
                                        streams: true,
                                        verbose: false,
                                    });

                                    if (Array.isArray(pullStreams)) {
                                        for (const pullStream of pullStreams) {
                                            if (pullStream && typeof pullStream.on === 'function') {
                                                await new Promise<void>(
                                                    (resolvePull, rejectPull) => {
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
                                                                const data = JSON.parse(
                                                                    chunk.toString(),
                                                                );
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
                                                    },
                                                );
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
                        } else {
                            sendLog('No images to pull (services use build context)');
                        }

                        sendLog('Starting services...');
                        const upResult = await compose.up({ verbose: true });

                        sendLog('Services started successfully');

                        const containerIds = upResult.services.map((container) => container.id);

                        sendLog(
                            `Connecting ${containerIds.length} containers to Traefik network...`,
                        );
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

                        resolve({ success: true, containers: containerIds });
                    } catch (error) {
                        reject(error);
                    }
                },
            );

            if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                await stream.writeSSE({
                    data: JSON.stringify({
                        type: 'complete',
                        result,
                    }),
                    event: 'compose-complete',
                });
            }

            await stream.close();
        } catch (error) {
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
