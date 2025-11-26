import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import type { BuildConfig } from '@/deployer/types';
import tar from 'tar-fs';

class DockerService {
    getLocalImageName(config: BuildConfig): string {
        return `${config.imageName}:${config.imageTag}`;
    }

    async buildImage(
        workDir: string,
        imageName: string,
        onLog?: (log: string) => void,
    ): Promise<{ imageId?: string }> {
        logger.info({ workDir, imageName }, 'Starting Docker build');

        return new Promise((resolve, reject) => {
            const tarStream = tar.pack(workDir);

            (docker.buildImage as any)(
                tarStream,
                { t: imageName, dockerfile: 'Dockerfile' },
                (err: any, stream: NodeJS.ReadableStream) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let imageId: string | undefined;

                    docker.modem.followProgress(
                        stream,
                        (progressErr: any, output: any) => {
                            if (progressErr) {
                                reject(progressErr);
                                return;
                            }

                            const lastOutput = output[output.length - 1];
                            if (lastOutput?.aux?.ID) {
                                imageId = lastOutput.aux.ID;
                            }

                            logger.info({ imageName, imageId }, 'Docker build completed');
                            resolve({ imageId });
                        },
                        (event: any) => {
                            if (event.stream) {
                                const line = event.stream.trim();
                                if (line && onLog) {
                                    onLog(line);
                                }
                            }
                            if (event.error && onLog) {
                                onLog(`ERROR: ${event.error}`);
                            }
                        },
                    );
                },
            );
        });
    }

    async deploy(
        projectId: string,
        imageName: string,
        options: {
            containerName?: string;
            port?: number;
            envVars?: Record<string, string>;
        } = {},
    ): Promise<{
        deploymentId: string;
        containerId: string;
        port: number;
    }> {
        const port = options.port || 3000;
        const containerName = options.containerName || `deploy-${projectId}-${Date.now()}`;

        logger.info({ projectId, imageName, containerName, port }, 'Starting deployment');

        // Remove existing container with same name
        try {
            const existing = docker.getContainer(containerName);
            const info = await existing.inspect();
            if (info.State.Running) {
                await existing.stop();
            }
            await existing.remove();
            logger.info({ containerName }, 'Removed existing container');
        } catch {
            // Container doesn't exist
        }

        // Create environment array
        const envArray = options.envVars
            ? Object.entries(options.envVars).map(([key, value]) => `${key}=${value}`)
            : [];

        // Create and start container
        const container = await docker.createContainer({
            name: containerName,
            Image: imageName,
            Env: envArray,
            ExposedPorts: {
                '3000/tcp': {},
            },
            HostConfig: {
                PortBindings: {
                    '3000/tcp': [{ HostPort: String(port) }],
                },
                RestartPolicy: {
                    Name: 'unless-stopped',
                },
            },
            Labels: {
                'deployer.project': projectId,
            },
        });

        await container.start();

        logger.info({ containerId: container.id, port }, 'Deployment started');

        return {
            deploymentId: containerName,
            containerId: container.id,
            port,
        };
    }

    async stopDeployment(containerName: string): Promise<void> {
        const container = docker.getContainer(containerName);
        await container.stop();
        logger.info({ containerName }, 'Deployment stopped');
    }

    async restartDeployment(containerName: string): Promise<void> {
        const container = docker.getContainer(containerName);
        await container.restart();
        logger.info({ containerName }, 'Deployment restarted');
    }

    async deleteDeployment(containerName: string): Promise<void> {
        const container = docker.getContainer(containerName);
        try {
            const info = await container.inspect();
            if (info.State.Running) {
                await container.stop();
            }
        } catch {
            // Container might not exist
        }
        await container.remove();
        logger.info({ containerName }, 'Deployment deleted');
    }

    async getDeploymentStatus(containerName: string): Promise<{ status: string }> {
        try {
            const container = docker.getContainer(containerName);
            const info = await container.inspect();
            return { status: info.State.Running ? 'running' : 'stopped' };
        } catch {
            return { status: 'not_found' };
        }
    }
}

export const dockerService = new DockerService();
