import type Docker from 'dockerode';
import type { Readable } from 'stream';
import * as tar from 'tar-fs';
import fs from 'fs';
import { logger } from '@/utils/logger';
import type {
    ParsedBuildConfig,
    BuildProgress,
} from '@workspace/typescript-interface/docker/docker.compose.build';

export type { BuildProgress };

export async function buildComposeServices(
    docker: Docker,
    buildConfigs: ParsedBuildConfig[],
    onProgress: (progress: BuildProgress) => void,
    signal?: AbortSignal,
): Promise<Map<string, string>> {
    const builtImages = new Map<string, string>();

    for (const config of buildConfigs) {
        if (signal?.aborted) {
            throw new DOMException('Build aborted', 'AbortError');
        }

        onProgress({
            type: 'log',
            serviceName: config.serviceName,
            message: `Building service: ${config.serviceName} (image: ${config.imageName})`,
        });

        try {
            const imageId = await buildServiceImage(docker, config, onProgress, signal);
            builtImages.set(config.serviceName, imageId);

            onProgress({
                type: 'complete',
                serviceName: config.serviceName,
                message: `Successfully built ${config.imageName}`,
                imageId,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            onProgress({
                type: 'error',
                serviceName: config.serviceName,
                message: `Build failed for ${config.serviceName}: ${errorMessage}`,
            });

            throw error;
        }
    }

    return builtImages;
}

async function buildServiceImage(
    docker: Docker,
    config: ParsedBuildConfig,
    onProgress: (progress: BuildProgress) => void,
    signal?: AbortSignal,
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(config.contextPath)) {
            return reject(
                new Error(`Build context path does not exist: ${config.contextPath}`),
            );
        }

        const stats = fs.statSync(config.contextPath);
        if (!stats.isDirectory()) {
            return reject(
                new Error(`Build context is not a directory: ${config.contextPath}`),
            );
        }

        logger.info(
            {
                serviceName: config.serviceName,
                imageName: config.imageName,
                contextPath: config.contextPath,
                dockerfile: config.dockerfile,
            },
            'Starting Docker build for compose service',
        );

        const tarStream = tar.pack(config.contextPath);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildOptions: any = {
            t: config.imageName,
            dockerfile: config.dockerfile,
            rm: true,
            forcerm: true,
            abortSignal: signal,
        };

        if (Object.keys(config.buildArgs).length > 0) {
            buildOptions.buildargs = JSON.stringify(config.buildArgs);
        }

        if (config.target) {
            buildOptions.target = config.target;
        }

        if (config.cacheFrom && config.cacheFrom.length > 0) {
            buildOptions.cachefrom = JSON.stringify(config.cacheFrom);
        }

        if (config.labels && Object.keys(config.labels).length > 0) {
            buildOptions.labels = JSON.stringify(config.labels);
        }

        if (config.shmSize) {
            buildOptions.shmsize = config.shmSize;
        }

        if (config.extraHosts && config.extraHosts.length > 0) {
            buildOptions.extrahosts = config.extraHosts.join(',');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (docker.buildImage as any)(
            tarStream,
            buildOptions,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err: any, stream: Readable) => {
                if (err) {
                    logger.error(
                        { err, serviceName: config.serviceName },
                        'Docker build initiation failed',
                    );
                    return reject(err);
                }

                if (signal?.aborted) {
                    stream.destroy();
                    return reject(new DOMException('Build aborted', 'AbortError'));
                }

                let imageId: string | undefined;
                let lastError: string | undefined;

                docker.modem.followProgress(
                    stream,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (progressErr: any, output: any) => {
                        if (progressErr) {
                            if (
                                progressErr.name === 'AbortError' ||
                                progressErr.message?.includes('aborted') ||
                                progressErr.message?.includes('cancel')
                            ) {
                                logger.info(
                                    { serviceName: config.serviceName },
                                    'Build was aborted',
                                );
                                return reject(
                                    new DOMException('Build aborted', 'AbortError'),
                                );
                            }
                            return reject(progressErr);
                        }

                        if (lastError) {
                            return reject(new Error(lastError));
                        }

                        if (Array.isArray(output)) {
                            for (const event of output) {
                                if (event.aux?.ID) {
                                    imageId = event.aux.ID;
                                }
                            }
                        }

                        logger.info(
                            {
                                serviceName: config.serviceName,
                                imageName: config.imageName,
                                imageId,
                            },
                            'Docker build completed for compose service',
                        );

                        resolve(imageId || config.imageName);
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (event: any) => {
                        if (signal?.aborted) {
                            return;
                        }

                        if (event.stream) {
                            const line = event.stream.trim();
                            if (line) {
                                onProgress({
                                    type: 'log',
                                    serviceName: config.serviceName,
                                    message: line,
                                });
                            }
                        }

                        if (event.error) {
                            lastError = event.error;
                            onProgress({
                                type: 'log',
                                serviceName: config.serviceName,
                                message: `ERROR: ${event.error}`,
                            });
                        }

                        if (event.status && !event.stream) {
                            let message = event.status;
                            if (event.id) {
                                message = `[${event.id}] ${message}`;
                            }
                            if (event.progress) {
                                message += ` ${event.progress}`;
                            }
                            onProgress({
                                type: 'log',
                                serviceName: config.serviceName,
                                message,
                            });
                        }
                    },
                );
            },
        );
    });
}

export async function cleanupPartialBuild(
    docker: Docker,
    imageNames: string[],
): Promise<void> {
    for (const imageName of imageNames) {
        try {
            const image = docker.getImage(imageName);
            await image.remove({ force: true });
            logger.info({ imageName }, 'Cleaned up partially built image');
        } catch (err) {
            logger.debug(
                { imageName, err },
                'Could not cleanup image (may not exist)',
            );
        }
    }
}
