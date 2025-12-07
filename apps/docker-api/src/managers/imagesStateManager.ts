import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ImageInfo, ImageInspectInfo } from 'dockerode';
import {
    Image,
    ImageAction,
    ImageEvent,
    ImageStateChanges,
} from '@workspace/typescript-interface/docker/docker.image';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { BaseStateManager } from '@/lib/BaseStateManager';
import * as tar from 'tar-fs';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { Readable } from 'stream';

class ImagesStateManager extends BaseStateManager {
    private images: Map<string, Image> = new Map();

    constructor() {
        super({
            managerName: 'Image State Manager',
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot load initial state: Docker is not connected');
            return;
        }

        try {
            const images = await docker.listImages({ all: true });

            for (const image of images) {
                const state = this.parseImageInfo(image);
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

        const stateChangeEvents: ImageAction[] = [
            'pull',
            'push',
            'tag',
            'untag',
            'delete',
            'import',
            'load',
            'save',
        ];

        if (stateChangeEvents.includes(action)) {
            await this.updateImageState(imageId, action);
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            const images = await docker.listImages({ all: true });

            for (const image of images) {
                const newState = this.parseImageInfo(image);
                const oldState = this.images.get(newState.id);

                if (!oldState) return;

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
    }

    protected getCustomStats(): Record<string, any> {
        return {
            imageCount: this.images.size,
        };
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
                }
            } else {
                logger.error({ err, imageId: imageIdSplited }, 'Error updating image state');
            }
        }
    }

    private async refreshImageState(imageId: string): Promise<void> {
        const image = docker.getImage(imageId);
        const info = await image.inspect();
        const newState = this.parseImageInfo(info);

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

    private parseImageInfo(image: ImageInfo | ImageInspectInfo): Image {
        const isInspect = this.isImageInspectInfo(image);

        const name = image.RepoTags?.map((tag) => tag.split(':')[0]);
        const tag = image.RepoTags?.map((tag) => tag.split(':')[1]);

        const id = image.Id.split(':')[1];

        return {
            id,
            fullId: image.Id,
            name: name || [],
            tag: tag || [],
            repoTags: image.RepoTags || [],
            repoDigests: image.RepoDigests || [],
            created: isInspect ? new Date(image.Created).getTime() / 1000 : image.Created,
            size: image.Size,
            virtualSize: image.VirtualSize,
            sharedSize: isInspect ? 0 : (image as ImageInfo).SharedSize || 0,
            labels: isInspect ? image.Config?.Labels || {} : (image as ImageInfo).Labels || {},
            containersUsed: (image as ImageInfo).Containers || 0,
            ...(isInspect && {
                parent: image.Parent,
                architecture: image.Architecture,
                os: image.Os,
            }),
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

        if (JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags))
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

    getState(imageId: string): Image | undefined {
        return this.images.get(imageId);
    }

    getByName(fullName: string): Image[] {
        console.log(fullName);
        return Array.from(this.images.values()).filter((image) =>
            image.name.some((n) => n.includes(fullName)),
        );
    }

    getLocalImageName(config: BuildConfig): string {
        return `${config.imageName}:${config.imageTag}`;
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of image state');

        try {
            const images = await docker.listImages({ all: true });
            const newImageMap = new Map<string, Image>();

            for (const image of images) {
                const state = this.parseImageInfo(image);
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

    async pruneAllUnusedImages(): Promise<void> {
        logger.info('Starting prune of all unused images');

        try {
            const result = await docker.pruneImages();
            logger.info({ result }, 'Pruned all unused images');
        } catch (err) {
            logger.error({ err }, 'Error pruning all unused images');
            throw err;
        }
    }

    async buildImage(
        workDir: string,
        imageName: string,
        onLog: (log: string) => void,
        signal?: AbortSignal,
    ): Promise<{ imageId?: string }> {
        logger.info({ workDir, imageName }, 'Starting Docker build');

        if (signal?.aborted) {
            throw new DOMException('Build aborted before start', 'AbortError');
        }

        return new Promise((resolve, reject) => {
            const tarStream = tar.pack(workDir);

            (docker.buildImage as any)(
                tarStream,
                {
                    t: imageName,
                    dockerfile: 'Dockerfile',
                    rm: true,
                    forcerm: true,
                    abortSignal: signal,
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

                    docker.modem.followProgress(
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

    async cleanupDanglingImages(): Promise<void> {
        try {
            const images = await docker.listImages({
                filters: { dangling: ['true'] },
            });

            for (const image of images) {
                try {
                    await docker.getImage(image.Id).remove({ force: true });
                    logger.info({ imageId: image.Id }, 'Removed dangling image');
                } catch (err) {
                    logger.warn({ imageId: image.Id, err }, 'Failed to remove dangling image');
                }
            }
        } catch (err) {
            logger.error({ err }, 'Failed to cleanup dangling images');
        }
    }
}

export const imagesStateManager = new ImagesStateManager();
