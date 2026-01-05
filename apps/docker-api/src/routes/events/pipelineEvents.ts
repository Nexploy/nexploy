import { Hono } from 'hono';
import { getImagesStateManager } from '@/managers/imagesStateManager';
import { streamSSE } from 'hono/streaming';
import { logger } from '@/utils/logger';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import DockerodeCompose from 'dockerode-compose';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import type { Readable } from 'stream';
import { spawn } from 'child_process';

const app = new Hono();

/**
 * Writes environment variables to a .env file in the working directory
 */
function writeEnvFile(workDir: string, envVars: Record<string, string>): string {
    const envFilePath = path.join(workDir, '.env');
    const envContent = Object.entries(envVars)
        .map(([key, value]) => {
            // Escape special characters and wrap in quotes if needed
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

/**
 * Safely removes the .env file if it exists
 */
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

/**
 * Runs docker compose build using the CLI (more reliable than dockerode-compose for building)
 */
function runDockerComposeBuild(
    workDir: string,
    composeFile: string,
    projectName: string,
    onLog: (message: string) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const args = [
            'compose',
            '-f',
            composeFile,
            '-p',
            projectName,
            'build',
            '--no-cache',
        ];

        const proc = spawn('docker', args, {
            cwd: workDir,
            env: process.env,
        });

        proc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(Boolean);
            for (const line of lines) {
                onLog(line);
            }
        });

        proc.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(Boolean);
            for (const line of lines) {
                onLog(line);
            }
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Docker compose build failed with exit code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn docker compose: ${err.message}`));
        });
    });
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

        c.req.raw.signal.addEventListener('abort', () => {
            isClientDisconnected = true;
        });

        try {
            const composeFile = composePath || 'docker-compose.yml';
            const composeFilePath = path.join(workDir, composeFile);

            logger.info(
                { workDir, projectName, composeFile, environmentId, hasEnvVars: !!envVars },
                'Starting Docker Compose deployment',
            );

            console.log({ projectName });

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

                        // Write .env file with environment variables if provided
                        if (envVars && Object.keys(envVars).length > 0) {
                            sendLog(
                                `Writing ${Object.keys(envVars).length} environment variable(s) to .env file...`,
                            );
                            writeEnvFile(workDir, envVars);
                            envFileWritten = true;
                            sendLog('Environment variables written successfully');
                        }

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

                        // Remove existing containers before starting new ones
                        sendLog('Removing existing containers if any...');
                        try {
                            await compose.down({ volumes: false });
                            sendLog('Existing containers removed');
                        } catch (downError) {
                            // Ignore errors from down (project might not exist yet)
                            sendLog('No existing containers to remove from project');
                        }

                        // Also remove any containers with matching names from compose file
                        // (in case they were created by a different project or manually)
                        const containerNames = Object.entries(composeContent.services || {})
                            .map(([serviceName, service]) => {
                                // Use container_name if specified, otherwise use default naming
                                return (service as { container_name?: string }).container_name;
                            })
                            .filter(Boolean) as string[];

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
                            } catch (removeError) {
                                // Container doesn't exist, which is fine
                            }
                        }

                        // Build images using docker compose CLI (more reliable than dockerode-compose)
                        const servicesToBuild = Object.entries(composeContent.services || {})
                            .filter(([, service]) => (service as { build?: unknown }).build)
                            .map(([name]) => name);

                        if (servicesToBuild.length > 0) {
                            sendLog(
                                `Building ${servicesToBuild.length} service(s): ${servicesToBuild.join(', ')}`,
                            );
                            await runDockerComposeBuild(workDir, composeFile, projectName, sendLog);
                            sendLog('Build completed successfully');
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
            // Cleanup .env file if it was written
            if (envFileWritten) {
                cleanupEnvFile(workDir);
                logger.info({ workDir }, 'Cleaned up .env file after compose deployment');
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
