import { Hono } from 'hono';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { spawn } from 'child_process';
import { logger } from '@/utils/logger';
import { execAsync } from '@/helpers/execAsync';
import { getCurrentDockerClient } from '@/lib/dockerContext';

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
            const args = [
                'compose',
                '-f',
                composeFile,
                '-p',
                projectName,
                'up',
                '-d',
                '--build',
                '--remove-orphans',
            ];

            logger.info(
                { workDir, projectName, composeFile },
                'Starting Docker Compose deployment',
            );

            const result = await new Promise<{ success: boolean; containers?: string[] }>(
                (resolve, reject) => {
                    const proc = spawn('docker', args, {
                        cwd: workDir,
                        env: {
                            ...process.env,
                            ...envVars,
                        },
                    });

                    let stdout = '';
                    let stderr = '';

                    proc.stdout.on('data', (data) => {
                        const output = data.toString();
                        stdout += output;

                        if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                            try {
                                stream.writeSSE({
                                    data: JSON.stringify({
                                        type: 'log',
                                        message: output.trim(),
                                        timestamp: new Date().toISOString(),
                                    }),
                                    event: 'compose-log',
                                });
                            } catch (e) {}
                        }
                    });

                    proc.stderr.on('data', (data) => {
                        const output = data.toString();
                        stderr += output;

                        if (!isClientDisconnected && !c.req.raw.signal.aborted) {
                            try {
                                stream.writeSSE({
                                    data: JSON.stringify({
                                        type: 'log',
                                        message: output.trim(),
                                        timestamp: new Date().toISOString(),
                                    }),
                                    event: 'compose-log',
                                });
                            } catch (e) {}
                        }
                    });

                    proc.on('close', async (code) => {
                        if (code === 0) {
                            try {
                                const { stdout: containersOutput } = await execAsync(
                                    `docker ps -q --filter "label=com.docker.compose.project=${projectName}"`,
                                );

                                const containerIds = containersOutput
                                    .trim()
                                    .split('\n')
                                    .filter(Boolean);

                                for (const containerId of containerIds) {
                                    try {
                                        const network =
                                            dockerClient.getNetwork('nexploy_traefik_network');

                                        await network.connect({
                                            Container: containerId,
                                        });
                                    } catch (e) {}
                                }

                                resolve({ success: true, containers: containerIds });
                            } catch (e) {
                                resolve({ success: true });
                            }
                        } else {
                            reject(new Error(`Docker Compose failed: ${stderr || stdout}`));
                        }
                    });

                    proc.on('error', reject);
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
