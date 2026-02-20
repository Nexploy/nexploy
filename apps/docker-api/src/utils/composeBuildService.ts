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
    extraLabels?: Record<string, string>,
): Promise<Map<string, string>> {
    if (signal?.aborted) {
        throw new DOMException('Build aborted', 'AbortError');
    }

    const builtImages = new Map<string, string>();

    // Local abort controller so the first failure cancels sibling builds
    const buildAbort = new AbortController();
    const onExternalAbort = () => buildAbort.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
        const results = await Promise.allSettled(
            buildConfigs.map(async (config) => {
                onProgress({
                    type: 'log',
                    serviceName: config.serviceName,
                    message: `Building service: ${config.serviceName} (image: ${config.imageName})`,
                });

                try {
                    const imageId = await buildServiceImage(
                        docker,
                        config,
                        onProgress,
                        buildAbort.signal,
                        extraLabels,
                    );
                    builtImages.set(config.serviceName, imageId);
                    onProgress({
                        type: 'complete',
                        serviceName: config.serviceName,
                        message: `Successfully built ${config.imageName}`,
                        imageId,
                    });
                } catch (error) {
                    buildAbort.abort();
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    onProgress({
                        type: 'error',
                        serviceName: config.serviceName,
                        message: `Build failed for ${config.serviceName}: ${errorMessage}`,
                    });
                    throw error;
                }
            }),
        );

        const firstFailure = results.find(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
        );
        if (firstFailure) {
            throw firstFailure.reason;
        }

        return builtImages;
    } finally {
        signal?.removeEventListener('abort', onExternalAbort);
    }
}

async function buildServiceImage(
    docker: Docker,
    config: ParsedBuildConfig,
    onProgress: (progress: BuildProgress) => void,
    signal?: AbortSignal,
    extraLabels?: Record<string, string>,
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

        const mergedLabels = {
            ...(extraLabels || {}),
            ...(config.labels || {}),
        };
        if (Object.keys(mergedLabels).length > 0) {
            buildOptions.labels = JSON.stringify(mergedLabels);
        }

        if (config.shmSize) {
            buildOptions.shmsize = config.shmSize;
        }

        if (config.extraHosts && config.extraHosts.length > 0) {
            buildOptions.extrahosts = config.extraHosts.join(',');
        }

        (docker.buildImage as any)(
            tarStream,
            buildOptions,

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
