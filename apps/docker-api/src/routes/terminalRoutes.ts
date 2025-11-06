import { Hono } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';
import type { WebSocket } from 'ws';
import { logger } from '@/utils/logger';
import { Duplex } from 'stream';
import Docker from 'dockerode';
import { docker } from '@/utils/dockerClient';

export const createTerminalRoutes = (
    upgradeWebSocket: UpgradeWebSocket<WebSocket, { onError: (err: unknown) => void }>,
) => {
    const app = new Hono();

    app.get(
        '/terminal/:containerId',
        upgradeWebSocket((c) => {
            const containerId = c.req.param('containerId');

            console.log('=== WEBSOCKET UPGRADE REQUESTED ===');
            console.log('Container ID:', containerId);
            console.log('URL:', c.req.url);

            logger.info({ containerId, url: c.req.url }, '🔌 WebSocket upgrade requested');

            let exec: Docker.Exec | null = null;
            let stream: Duplex | null = null;

            return {
                async onOpen(event, ws) {
                    console.log('=== ON OPEN CALLED ===');
                    console.log('Container ID:', containerId);

                    try {
                        logger.info({ containerId }, '✅ WebSocket onOpen called');

                        console.log('Getting container instance...');
                        const container = docker.getContainer(containerId);
                        console.log('✅ Container instance obtained');

                        logger.info({ containerId }, '📦 Got container instance');

                        console.log('Inspecting container...');
                        const containerInfo = await container.inspect();
                        console.log('✅ Container inspected');
                        console.log('Container state:', {
                            running: containerInfo.State.Running,
                            status: containerInfo.State.Status,
                            paused: containerInfo.State.Paused,
                            restarting: containerInfo.State.Restarting,
                        });

                        logger.info(
                            {
                                containerId,
                                running: containerInfo.State.Running,
                                status: containerInfo.State.Status,
                                health: containerInfo.State.Health?.Status,
                            },
                            '🔍 Container inspected',
                        );

                        if (!containerInfo.State.Running) {
                            const errorMsg = `Container is not running (status: ${containerInfo.State.Status})`;
                            console.error('❌', errorMsg);
                            logger.error({ containerId }, errorMsg);
                            ws.send(JSON.stringify({ type: 'error', error: errorMsg }));
                            ws.close();
                            return;
                        }

                        const execOptions: Docker.ExecCreateOptions = {
                            AttachStdin: true,
                            AttachStdout: true,
                            AttachStderr: true,
                            Tty: true,
                            Cmd: [
                                '/bin/sh',
                                '-c',
                                'command -v bash >/dev/null && exec bash || exec sh',
                            ],
                            Env: ['TERM=xterm-256color'],
                        };

                        console.log('Creating exec with options:', execOptions);
                        logger.info({ containerId, cmd: execOptions.Cmd }, '🚀 Creating exec');

                        exec = await container.exec(execOptions);
                        console.log('✅ Exec created');
                        logger.info({ containerId }, '✅ Exec created successfully');

                        // Vérifier que le WebSocket est toujours ouvert
                        console.log('WebSocket readyState before starting exec:', ws.readyState);
                        if (ws.readyState !== 1) {
                            console.warn('⚠️ WebSocket closed before starting exec');
                            logger.warn(
                                { containerId, readyState: ws.readyState },
                                '⚠️ WebSocket closed before starting exec',
                            );
                            return;
                        }

                        console.log('Starting exec stream...');
                        logger.info({ containerId }, '🎬 Starting exec stream');

                        stream = (await exec.start({
                            hijack: true,
                            stdin: true,
                            Tty: true,
                        })) as Duplex;

                        console.log('✅ Stream started successfully');
                        logger.info({ containerId }, '✅ Stream started successfully');

                        // Envoyer un message de bienvenue
                        if (ws.readyState === 1) {
                            console.log('Sending welcome message...');
                            ws.send(
                                '\r\n\x1b[32m*** Connected to container terminal ***\x1b[0m\r\n\r\n',
                            );
                        }

                        // Gérer les données du conteneur vers le WebSocket
                        stream.on('data', (chunk) => {
                            try {
                                if (ws.readyState === 1) {
                                    ws.send(chunk);
                                }
                            } catch (err) {
                                console.error('Error sending data to WebSocket:', err);
                                logger.error(
                                    { err, containerId },
                                    'Error sending data to WebSocket',
                                );
                            }
                        });

                        stream.on('end', () => {
                            console.log('Stream ended');
                            logger.info({ containerId }, 'Stream ended');
                            try {
                                if (ws.readyState === 1) {
                                    ws.send(
                                        '\r\n\x1b[33m*** Terminal session ended ***\x1b[0m\r\n',
                                    );
                                    ws.close();
                                }
                            } catch (err) {
                                console.error('Error closing WebSocket on stream end:', err);
                                logger.error({ err }, 'Error closing WebSocket on stream end');
                            }
                        });

                        stream.on('error', (err: Error) => {
                            console.error('❌ Stream error:', err);
                            logger.error({ err, containerId }, '❌ Stream error');
                            try {
                                if (ws.readyState === 1) {
                                    ws.send(`\r\n\x1b[31m*** Error: ${err.message} ***\x1b[0m\r\n`);
                                    ws.close();
                                }
                            } catch (sendErr) {
                                console.error('Error sending error to WebSocket:', sendErr);
                                logger.error({ err: sendErr }, 'Error sending error to WebSocket');
                            }
                        });

                        console.log('=== ON OPEN COMPLETED SUCCESSFULLY ===');
                    } catch (err) {
                        console.error('=== ERROR IN ON OPEN ===');
                        console.error('Error:', err);
                        console.error(
                            'Error message:',
                            err instanceof Error ? err.message : String(err),
                        );
                        console.error('Stack trace:', err instanceof Error ? err.stack : 'N/A');

                        logger.error(
                            {
                                err,
                                containerId,
                                message: err instanceof Error ? err.message : String(err),
                                stack: err instanceof Error ? err.stack : undefined,
                            },
                            '❌ Failed to create exec instance',
                        );

                        try {
                            if (ws.readyState === 1) {
                                const errorMessage =
                                    err instanceof Error ? err.message : String(err);
                                ws.send(`\r\n\x1b[31m*** Error: ${errorMessage} ***\x1b[0m\r\n`);
                            }
                            ws.close();
                        } catch (sendErr) {
                            console.error('Error sending error message:', sendErr);
                            logger.error({ err: sendErr }, 'Error sending error message');
                        }
                    }
                },

                onMessage(event, ws) {
                    try {
                        const data = event.data;

                        if (!stream || stream.destroyed) {
                            console.warn('Received message but stream is not available');
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
                        } else if (data instanceof Buffer) {
                            stream.write(data);
                        } else if (data instanceof Blob) {
                            data.arrayBuffer().then((buffer) => {
                                if (stream && !stream.destroyed) {
                                    stream.write(Buffer.from(buffer));
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error handling WebSocket message:', err);
                        logger.error({ err, containerId }, 'Error handling WebSocket message');
                    }
                },

                onClose(event, ws) {
                    console.log('=== WEBSOCKET CLOSED ===');
                    console.log('Code:', event.code);
                    console.log('Reason:', event.reason);

                    logger.info(
                        { containerId, code: event.code, reason: event.reason },
                        '🔌 WebSocket closed',
                    );

                    if (stream && !stream.destroyed) {
                        try {
                            stream.end();
                            stream.destroy();
                        } catch (err) {
                            console.error('Error destroying stream:', err);
                            logger.error({ err }, 'Error destroying stream');
                        }
                    }

                    stream = null;
                    exec = null;
                },

                onError(event, ws) {
                    console.error('=== WEBSOCKET ERROR EVENT ===');
                    console.error('Error:', event);

                    logger.error({ containerId, error: event }, '❌ WebSocket error event');

                    if (stream && !stream.destroyed) {
                        try {
                            stream.destroy();
                        } catch (err) {
                            console.error('Error destroying stream on error:', err);
                            logger.error({ err }, 'Error destroying stream on error');
                        }
                    }

                    stream = null;
                    exec = null;
                },
            };
        }),
    );

    return app;
};
