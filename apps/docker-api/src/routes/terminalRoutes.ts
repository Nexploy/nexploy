import { Hono } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';
import type { WebSocket } from 'ws';
import { logger } from '@/utils/logger';
import { Duplex } from 'stream';
import type Docker from 'dockerode';
import { Exec, ExecCreateOptions } from 'dockerode';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';

function getShellCommand(shell: string): string[] {
    switch (shell) {
        case 'bash':
            return ['/bin/bash'];
        case 'sh':
            return ['/bin/sh'];
        case 'ash':
            return ['/bin/ash'];
        case 'dash':
            return ['/bin/dash'];
        default:
            return [
                '/bin/sh',
                '-c',
                'command -v bash >/dev/null && exec bash || command -v ash >/dev/null && exec ash || command -v dash >/dev/null && exec dash || exec sh',
            ];
    }
}

export const createTerminalRoutes = (
    upgradeWebSocket: UpgradeWebSocket<WebSocket, { onError: (err: unknown) => void }>,
) => {
    const app = new Hono();

    app.get(
        '/terminal/:containerId/:shell',
        upgradeWebSocket((c) => {
            const containerId = c.req.param('containerId')!;
            const shell = c.req.param('shell') ?? 'auto';
            const environmentId = c.req.query('environment');

            let exec: Exec | null = null;
            let stream: Duplex | null = null;
            let dockerClient: Docker;

            try {
                dockerClient = environmentId
                    ? dockerClientRegistry.getClient(environmentId)
                    : dockerClientRegistry.getDefaultClient();
            } catch (err) {
                logger.error({ err, environmentId }, 'Failed to get Docker client for WebSocket');
                dockerClient = dockerClientRegistry.getDefaultClient();
            }

            return {
                async onOpen(_, ws) {
                    try {
                        const container = dockerClient.getContainer(containerId);
                        const containerInfo = await container.inspect();

                        if (!containerInfo.State.Running) {
                            const errorMsg = `Container is not running (status: ${containerInfo.State.Status})`;
                            ws.send(JSON.stringify({ type: 'error', error: errorMsg }));
                            ws.close();
                            return;
                        }

                        const execOptions: ExecCreateOptions = {
                            AttachStdin: true,
                            AttachStdout: true,
                            AttachStderr: true,
                            Tty: true,
                            Cmd: getShellCommand(shell),
                            Env: ['TERM=xterm-256color'],
                        };

                        logger.info(
                            { containerId, cmd: execOptions.Cmd, shell },
                            '🚀 Creating exec',
                        );

                        exec = await container.exec(execOptions);

                        if (ws.readyState !== 1) {
                            logger.warn(
                                { containerId, readyState: ws.readyState },
                                '⚠️ WebSocket closed before starting exec',
                            );
                            return;
                        }

                        stream = (await exec.start({
                            hijack: true,
                            stdin: true,
                            Tty: true,
                        })) as Duplex;

                        stream.on('data', (chunk) => {
                            if (ws.readyState === 1) {
                                ws.send(chunk);
                            }
                        });

                        stream.on('end', () => {
                            if (ws.readyState === 1) {
                                ws.send('\r\n\x1b[33m*** Terminal session ended ***\x1b[0m\r\n');
                                ws.close();
                            }
                        });

                        stream.on('error', (err: Error) => {
                            if (ws.readyState === 1) {
                                ws.send(`\r\n\x1b[31m*** Error: ${err.message} ***\x1b[0m\r\n`);
                                ws.close();
                            }
                        });
                    } catch (err) {
                        try {
                            if (ws.readyState === 1) {
                                const errorMessage =
                                    err instanceof Error ? err.message : String(err);
                                ws.send(`\r\n\x1b[31m*** Error: ${errorMessage} ***\x1b[0m\r\n`);
                            }
                            ws.close();
                        } catch (sendErr) {
                            logger.error({ err: sendErr }, 'Error sending error message');
                        }
                    }
                },

                onMessage(event) {
                    try {
                        const data = event.data;

                        if (!stream || stream.destroyed) {
                            logger.warn(
                                { containerId },
                                'Received message but stream is not available',
                            );
                            return;
                        }

                        if (typeof data === 'string') {
                            stream.write(data);
                        } else if (data instanceof ArrayBuffer) {
                            stream.write(Buffer.from(data));
                        } else if (data instanceof Blob) {
                            data.arrayBuffer().then((buffer) => {
                                if (stream && !stream.destroyed) {
                                    stream.write(Buffer.from(buffer));
                                }
                            });
                        }
                    } catch (err) {
                        logger.error({ err, containerId }, 'Error handling WebSocket message');
                    }
                },

                onClose(event, ws) {
                    logger.info(
                        { containerId, code: event.code, reason: event.reason },
                        '🔌 WebSocket closed',
                    );

                    if (stream && !stream.destroyed) {
                        stream.end();
                        stream.destroy();
                    }

                    stream = null;
                    exec = null;
                },

                onError(event, ws) {
                    logger.error({ containerId, error: event }, '❌ WebSocket error event');

                    if (stream && !stream.destroyed) {
                        stream.destroy();
                    }

                    stream = null;
                    exec = null;
                },
            };
        }),
    );

    app.get(
        '/attach/:containerId',
        upgradeWebSocket((c) => {
            const containerId = c.req.param('containerId')!;
            const environmentId = c.req.query('environment');

            let stream: Duplex | null = null;
            let dockerClient: Docker;

            try {
                dockerClient = environmentId
                    ? dockerClientRegistry.getClient(environmentId)
                    : dockerClientRegistry.getDefaultClient();
            } catch (err) {
                logger.error({ err, environmentId }, 'Failed to get Docker client for WebSocket');
                dockerClient = dockerClientRegistry.getDefaultClient();
            }

            return {
                async onOpen(_, ws) {
                    try {
                        const container = dockerClient.getContainer(containerId);
                        const containerInfo = await container.inspect();

                        if (!containerInfo.State.Running) {
                            const errorMsg = `Container is not running (status: ${containerInfo.State.Status})`;
                            ws.send(JSON.stringify({ type: 'error', error: errorMsg }));
                            ws.close();
                            return;
                        }

                        logger.info({ containerId }, '🔗 Attaching to container');

                        if (ws.readyState !== 1) {
                            logger.warn(
                                { containerId, readyState: ws.readyState },
                                '⚠️ WebSocket closed before attaching',
                            );
                            return;
                        }

                        stream = (await container.attach({
                            stream: true,
                            stdin: true,
                            stdout: true,
                            stderr: true,
                        })) as Duplex;

                        stream.on('data', (chunk) => {
                            if (ws.readyState === 1) {
                                ws.send(chunk);
                            }
                        });

                        stream.on('end', () => {
                            if (ws.readyState === 1) {
                                ws.send('\r\n\x1b[33m*** Container attach ended ***\x1b[0m\r\n');
                                ws.close();
                            }
                        });

                        stream.on('error', (err: Error) => {
                            if (ws.readyState === 1) {
                                ws.send(`\r\n\x1b[31m*** Error: ${err.message} ***\x1b[0m\r\n`);
                                ws.close();
                            }
                        });
                    } catch (err) {
                        try {
                            if (ws.readyState === 1) {
                                const errorMessage =
                                    err instanceof Error ? err.message : String(err);
                                ws.send(`\r\n\x1b[31m*** Error: ${errorMessage} ***\x1b[0m\r\n`);
                            }
                            ws.close();
                        } catch (sendErr) {
                            logger.error({ err: sendErr }, 'Error sending error message');
                        }
                    }
                },

                onMessage(event) {
                    try {
                        const data = event.data;

                        if (!stream || stream.destroyed) {
                            logger.warn(
                                { containerId },
                                'Received message but stream is not available',
                            );
                            return;
                        }

                        if (typeof data === 'string') {
                            stream.write(data);
                        } else if (data instanceof ArrayBuffer) {
                            stream.write(Buffer.from(data));
                        } else if (data instanceof Blob) {
                            data.arrayBuffer().then((buffer) => {
                                if (stream && !stream.destroyed) {
                                    stream.write(Buffer.from(buffer));
                                }
                            });
                        }
                    } catch (err) {
                        logger.error({ err, containerId }, 'Error handling WebSocket message');
                    }
                },

                onClose(event, ws) {
                    logger.info(
                        { containerId, code: event.code, reason: event.reason },
                        '🔌 WebSocket closed (attach)',
                    );

                    if (stream && !stream.destroyed) {
                        stream.end();
                        stream.destroy();
                    }

                    stream = null;
                },

                onError(event, ws) {
                    logger.error(
                        { containerId, error: event },
                        '❌ WebSocket error event (attach)',
                    );

                    if (stream && !stream.destroyed) {
                        stream.destroy();
                    }

                    stream = null;
                },
            };
        }),
    );

    return app;
};
