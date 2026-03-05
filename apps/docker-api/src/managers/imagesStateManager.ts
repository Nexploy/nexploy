import { logger } from '@/utils/logger';
import { ImageInfo, ImageInspectInfo } from 'dockerode';
import {
    Image,
    ImageAction,
    ImageEvent,
    ImageStateChanges,
} from '@workspace/typescript-interface/docker/docker.image';
import { BaseStateManager } from '@/lib/BaseStateManager';
import * as tar from 'tar-fs';
import { Readable } from 'stream';
import { containerImageEvents } from '@/managers/containersStateManager';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import dayjs from 'dayjs';
import { NEXPLOY_LABELS } from '@/utils/nexployLabels';

const IMAGE_STATE_CHANGE_EVENTS = new Set<ImageAction>([
    'pull',
    'push',
    'tag',
    'untag',
    'delete',
    'import',
    'load',
    'save',
]);

export class ImagesStateManager extends BaseStateManager {
    private images: Map<string, Image> = new Map();

    constructor(environmentId: string) {
        super({
            managerName: `Image State Manager [${environmentId}]`,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
        this.setupContainerListeners();
    }

    private setupContainerListeners(): void {
        containerImageEvents.on('container-usage-changed', () => {
            this.updateImageUsageFromContainers();
        });
    }

    async loadInitialState(): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.warn('Cannot load initial state: Docker is not connected');
                return;
            }
        } catch (err) {
            logger.warn('Cannot load initial state: Docker status manager not available');
            return;
        }

        try {
            const images = await this.docker.listImages({ all: true });
            const parsed = await Promise.all(images.map((image) => this.parseImageInfo(image)));

            for (const state of parsed) {
                this.images.set(state.id, state);
            }

            logger.info({ count: this.images.size }, 'Initial image state loaded');

            const initialState: ImageEvent = {
                type: 'initial',
                images: Array.from(this.images.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
        } catch (err) {
            logger.error({ err }, 'Error loading initial image state');
            throw err;
        }
    }

    async handleDockerEvent(event: any): Promise<void> {
        const imageId = event.Actor?.ID;
        if (!imageId) return;

        const action = event.Action;
        logger.debug({ imageId, action }, 'Docker Image event received');

        if (IMAGE_STATE_CHANGE_EVENTS.has(action)) {
            await this.updateImageState(imageId, action);
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            const images = await this.docker.listImages({ all: true });
            const parsed = await Promise.all(images.map((image) => this.parseImageInfo(image)));

            for (const newState of parsed) {
                const oldState = this.images.get(newState.id);

                if (!oldState) continue;

                if (this.hasStateChanged(oldState, newState)) {
                    this.images.set(newState.id, newState);

                    const stateChangeDate: ImageEvent = {
                        type: 'state-change',
                        imageId: newState.id,
                        image: newState,
                        changes: this.getStateChanges(oldState, newState),
                        timestamp: Date.now(),
                    };
                    this.emit('state-change', stateChangeDate);
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in full state sync');
        }
    }

    getEventFilters(): Record<string, string[]> {
        return { type: ['image'] };
    }

    protected onStop(): void {
        this.images.clear();
        containerImageEvents.removeAllListeners('containers-loaded');
        containerImageEvents.removeAllListeners('container-usage-changed');
    }

    private async updateImageUsageFromContainers(): Promise<void> {
        try {
            const containers = await this.docker.listContainers({ all: true });
            const imageUsageMap = new Map<string, number>();

            for (const container of containers) {
                let imageId = container.ImageID;
                if (imageId.includes(':')) {
                    imageId = imageId.split(':')[1];
                }
                imageUsageMap.set(imageId, (imageUsageMap.get(imageId) || 0) + 1);
            }

            for (const [imageId, image] of this.images.entries()) {
                const newContainersUsed = imageUsageMap.get(imageId) || 0;

                if (image.containersUsed !== newContainersUsed) {
                    const oldState = { ...image };
                    const newState = {
                        ...image,
                        containersUsed: newContainersUsed,
                        timestamp: Date.now(),
                    };

                    this.images.set(imageId, newState);

                    const imageUpdated: ImageEvent = {
                        type: 'updated',
                        oldState,
                        image: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-updated', imageUpdated);

                    logger.debug(
                        { imageId, oldCount: oldState.containersUsed, newCount: newContainersUsed },
                        'Image container usage updated',
                    );
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error updating image usage from containers');
        }
    }

    protected getCustomStats(): Record<string, any> {
        return {
            imageCount: this.images.size,
        };
    }

    private async syncVersionDelete(oldState: Image): Promise<void> {
        const repositoryId = oldState.labels?.[NEXPLOY_LABELS.repositoryId];
        const imageTag = oldState.labels?.[NEXPLOY_LABELS.buildId];

        if (!repositoryId || !imageTag) return;

        logger.debug(
            `Syncing version delete for image ${oldState.id} with repositoryId ${repositoryId} and imageTag ${imageTag}`,
        );

        const nexployUrl = process.env.NEXPLOY_API_URL;
        const apiKey = process.env.NEXPLOY_API_KEY;

        if (!nexployUrl || !apiKey) {
            logger.warn('Cannot sync version delete: NEXPLOY_API_URL or NEXPLOY_API_KEY not set');
            return;
        }

        try {
            const response = await fetch(`${nexployUrl}/api/internal/versions/sync-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({ repositoryId, imageTag }),
            });

            if (!response.ok) {
                logger.warn(
                    { repositoryId, imageTag, status: response.status },
                    'Failed to sync version delete to nexploy',
                );
            } else {
                logger.debug({ repositoryId, imageTag }, 'Version sync delete sent to nexploy');
            }
        } catch (err) {
            logger.warn(
                { err, repositoryId, imageTag },
                'Error calling nexploy version sync-delete',
            );
        }
    }

    private async updateImageState(imageId: string, action?: ImageAction): Promise<void> {
        const imageIdSplited = imageId.split(':')[1];

        try {
            if (action === 'delete') {
                const oldState = this.images.get(imageIdSplited);
                if (oldState) {
                    this.images.delete(imageIdSplited);
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                    await this.syncVersionDelete(oldState);
                    logger.debug({ imageIdSplited }, 'Image deleted');
                }
                return;
            }

            if (action === 'untag') {
                try {
                    await this.refreshImageState(imageIdSplited);
                } catch (err: any) {
                    if (err.statusCode === 404) {
                        const oldState = this.images.get(imageIdSplited);
                        if (oldState) {
                            this.images.delete(imageIdSplited);
                            const imageRemovedData: ImageEvent = {
                                type: 'removed',
                                imageId: oldState.id,
                                oldState,
                                timestamp: Date.now(),
                            };
                            this.emit('image-removed', imageRemovedData);
                            await this.syncVersionDelete(oldState);
                            logger.debug({ imageId }, 'Image removed after untag');
                        }
                    } else {
                        throw err;
                    }
                }
                return;
            }
            await this.refreshImageState(imageId);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.images.get(imageIdSplited);
                this.images.delete(imageIdSplited);

                if (oldState) {
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                    await this.syncVersionDelete(oldState);
                }
            } else {
                logger.error({ err, imageId: imageIdSplited }, 'Error updating image state');
            }
        }
    }

    private async refreshImageState(imageId: string): Promise<void> {
        const image = this.docker.getImage(imageId);
        const info = await image.inspect();
        const newState = await this.parseImageInfo(info);

        const oldState = this.images.get(newState.id);
        this.images.set(newState.id, newState);

        if (!oldState) {
            const imageAdded: ImageEvent = {
                type: 'added',
                image: newState,
                timestamp: Date.now(),
            };
            this.emit('image-added', imageAdded);
        } else if (this.hasStateChanged(oldState, newState)) {
            const imageUpdated: ImageEvent = {
                type: 'updated',
                oldState,
                image: newState,
                timestamp: Date.now(),
            };
            this.emit('image-updated', imageUpdated);
        }
    }

    private isImageInspectInfo(image: ImageInfo | ImageInspectInfo): image is ImageInspectInfo {
        return 'Config' in image || 'Architecture' in image;
    }

    private async parseImageInfo(image: ImageInfo | ImageInspectInfo): Promise<Image> {
        const isInspect = this.isImageInspectInfo(image);

        const name = image.RepoTags?.map((tag) => tag.split(':')[0]);
        const tag = image.RepoTags?.map((tag) => tag.split(':')[1]);

        const id = image.Id.split(':')[1];

        let inspectData: ImageInspectInfo | null = isInspect ? image : null;
        if (!isInspect) {
            try {
                const img = this.docker.getImage(image.Id);
                inspectData = await img.inspect();
            } catch {}
        }

        const cfg = inspectData?.Config;

        return {
            id,
            fullId: image.Id,
            name: name || [],
            tag: tag || [],
            repoTags: image.RepoTags || [],
            repoDigests: image.RepoDigests || [],
            created: isInspect
                ? dayjs(image.Created).valueOf()
                : dayjs.unix(image.Created).valueOf(),
            size: image.Size,
            virtualSize: image.VirtualSize,
            sharedSize: isInspect ? 0 : (image as ImageInfo).SharedSize || 0,
            labels: cfg?.Labels || (image as ImageInfo).Labels || {},
            containersUsed: (image as ImageInfo).Containers || 0,
            ...(inspectData && {
                parent: inspectData.Parent,
                architecture: inspectData.Architecture,
                os: inspectData.Os,
            }),
            config: cfg
                ? {
                      cmd: cfg.Cmd || null,
                      entrypoint: Array.isArray(cfg.Entrypoint)
                          ? cfg.Entrypoint
                          : cfg.Entrypoint
                            ? [cfg.Entrypoint]
                            : null,
                      env: cfg.Env || [],
                      workingDir: cfg.WorkingDir || '',
                      exposedPorts: cfg.ExposedPorts || {},
                      volumes: cfg.Volumes || null,
                      user: cfg.User || '',
                      shell: (cfg as any).Shell || null,
                      stopSignal: (cfg as any).StopSignal || '',
                  }
                : undefined,
            timestamp: Date.now(),
        };
    }

    private hasStateChanged(oldState: Image, newState: Image): boolean {
        return (
            JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags) ||
            oldState.size !== newState.size ||
            oldState.containersUsed !== newState.containersUsed
        );
    }

    private getStateChanges(oldState: Image, newState: Image): ImageStateChanges {
        const changes: ImageStateChanges = {};

        const oldRepoTags = JSON.stringify(oldState.repoTags);
        const newRepoTags = JSON.stringify(newState.repoTags);

        if (oldRepoTags !== newRepoTags)
            changes.repoTags = { from: oldState.repoTags, to: newState.repoTags };
        if (oldState.size !== newState.size)
            changes.size = { from: oldState.size, to: newState.size };
        if (oldState.containersUsed !== newState.containersUsed)
            changes.containers = {
                from: oldState.containersUsed,
                to: newState.containersUsed,
            };

        return changes;
    }

    getAllImages(): Image[] {
        return Array.from(this.images.values());
    }

    getById(imageId: string): Image | undefined {
        return this.images.get(imageId);
    }

    getByName(fullName: string): Image[] {
        return Array.from(this.images.values()).filter((image) =>
            image.name.some((n) => n.includes(fullName)),
        );
    }

    checkIfExistByName(fullName: string): boolean {
        return Array.from(this.images.values()).some((image) =>
            image.name.some((n) => n.includes(fullName)),
        );
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of image state');

        try {
            const images = await this.docker.listImages({ all: true });
            const newImageMap = new Map<string, Image>();
            const parsed = await Promise.all(images.map((image) => this.parseImageInfo(image)));

            for (const state of parsed) {
                newImageMap.set(state.id, state);
            }

            for (const [imageId, oldState] of this.images.entries()) {
                if (!newImageMap.has(imageId)) {
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                    await this.syncVersionDelete(oldState);
                    logger.debug({ imageId }, 'Image detected as removed during hard refresh');
                }
            }

            for (const [imageId, newState] of newImageMap.entries()) {
                const oldState = this.images.get(imageId);

                if (!oldState) {
                    const imageAdded: ImageEvent = {
                        type: 'added',
                        image: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-added', imageAdded);
                    logger.debug({ imageId }, 'Image detected as added during hard refresh');
                } else if (this.hasStateChanged(oldState, newState)) {
                    const imageUpdated: ImageEvent = {
                        type: 'updated',
                        oldState,
                        image: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-updated', imageUpdated);
                    logger.debug({ imageId }, 'Image detected as updated during hard refresh');
                }
            }

            this.images = newImageMap;

            logger.info({ count: this.images.size }, 'Hard refresh completed successfully');
        } catch (err) {
            logger.error({ err }, 'Error during hard refresh of image state');
            throw err;
        }
    }

    async buildImage(
        workDir: string,
        imageName: string,
        dockerfilePath: string | undefined,
        onLog: (log: string) => void,
        signal?: AbortSignal,
        labels?: Record<string, string>,
    ): Promise<{ imageId?: string }> {
        logger.info({ workDir, imageName, dockerfilePath }, 'Starting Docker build');

        if (signal?.aborted) {
            throw new DOMException('Build aborted before start', 'AbortError');
        }

        return new Promise((resolve, reject) => {
            const tarStream = tar.pack(workDir);

            (this.docker.buildImage as any)(
                tarStream,
                {
                    t: imageName,
                    dockerfile: dockerfilePath || 'Dockerfile',
                    rm: true,
                    forcerm: true,
                    abortSignal: signal,
                    ...(labels && { labels }),
                },
                (err: any, stream: Readable) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (signal?.aborted) {
                        stream.destroy();
                        reject(new DOMException('Build aborted', 'AbortError'));
                        return;
                    }

                    let imageId: string | undefined;

                    this.docker.modem.followProgress(
                        stream,
                        async (progressErr: any, output: any) => {
                            if (progressErr) {
                                if (
                                    progressErr.name === 'AbortError' ||
                                    progressErr.message?.includes('aborted') ||
                                    progressErr.message?.includes('cancel')
                                ) {
                                    logger.info('Build was aborted');
                                    reject(new DOMException('Build aborted', 'AbortError'));
                                    return;
                                }
                                reject(progressErr);
                                return;
                            }

                            const lastOutput = output[output.length - 1];
                            if (lastOutput?.aux?.ID) {
                                imageId = lastOutput.aux.ID;
                            }

                            logger.info({ imageName, imageId }, 'Docker build completed');

                            await this.cleanupDanglingImages();
                            resolve({ imageId });
                        },
                        (event: any) => {
                            if (signal?.aborted) {
                                return;
                            }

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

    async pushImage(
        imageName: string,
        targetName: string,
        auth: { serveraddress: string; username: string; password: string },
        onLog: (log: string) => void,
        signal?: AbortSignal,
    ): Promise<{ targetName: string }> {
        logger.info({ imageName, targetName }, 'Starting Docker push');

        if (signal?.aborted) {
            throw new DOMException('Push aborted before start', 'AbortError');
        }

        // Parse targetName into repo and tag
        const lastSlash = targetName.lastIndexOf('/');
        const nameAndTag = lastSlash >= 0 ? targetName.slice(lastSlash + 1) : targetName;
        const colonIdx = nameAndTag.lastIndexOf(':');
        const targetTag = colonIdx >= 0 ? nameAndTag.slice(colonIdx + 1) : 'latest';
        const targetRepo = colonIdx >= 0 ? targetName.slice(0, targetName.lastIndexOf(':')) : targetName;

        // Tag the image
        const image = this.docker.getImage(imageName);
        await image.tag({ repo: targetRepo, tag: targetTag });
        onLog(`Tagged ${imageName} as ${targetRepo}:${targetTag}`);

        // Push the tagged image
        return new Promise((resolve, reject) => {
            const taggedImage = this.docker.getImage(targetName);
            (taggedImage.push as any)({ authconfig: auth }, (err: any, stream: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (signal?.aborted) {
                    stream.destroy();
                    reject(new DOMException('Push aborted', 'AbortError'));
                    return;
                }

                this.docker.modem.followProgress(
                    stream,
                    (progressErr: any) => {
                        if (progressErr) {
                            if (
                                progressErr.name === 'AbortError' ||
                                progressErr.message?.includes('aborted')
                            ) {
                                reject(new DOMException('Push aborted', 'AbortError'));
                                return;
                            }
                            reject(progressErr);
                            return;
                        }
                        logger.info({ imageName, targetName }, 'Docker push completed');
                        resolve({ targetName });
                    },
                    (event: any) => {
                        if (signal?.aborted) return;
                        const msg = event.status
                            ? event.progress
                                ? `${event.status} ${event.progress}`
                                : event.status
                            : event.error
                              ? `ERROR: ${event.error}`
                              : null;
                        if (msg && onLog) onLog(msg);
                        if (event.error) reject(new Error(event.error));
                    },
                );
            });
        });
    }

    async cleanupDanglingImages(): Promise<void> {
        try {
            await this.docker.pruneImages({
                filters: { dangling: ['true'] },
            });
            logger.info('Pruned dangling images');
        } catch (err) {
            logger.error({ err }, 'Failed to prune images');
        }
    }
}

export function getImagesStateManager(): ImagesStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).images;
    }
    return stateManagerFactory.getManagers(environmentId).images;
}

export const imagesStateManager = new Proxy({} as ImagesStateManager, {
    get(_target, prop) {
        const manager = getImagesStateManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
