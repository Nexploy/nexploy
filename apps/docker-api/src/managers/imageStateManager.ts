import { ImageInspectInfo } from 'dockerode';
import { Image, ImageDetailEvent, ImageHistoryEntry, } from '@workspace/typescript-interface/docker/docker.image';
import { BaseSingleResourceStateManager } from '@/lib/BaseSingleResourceStateManager';

export class ImageStateManager extends BaseSingleResourceStateManager<Image> {
    constructor(imageId: string, environmentId: string) {
        super({
            resourceType: 'Image',
            resourceId: imageId,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 50,
        });
    }

    async fetchResourceState(): Promise<Image> {
        const info = await this.docker.getImage(this.resourceId).inspect();
        return this.parseImageInspect(info);
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['image'],
            image: [this.resourceId],
        };
    }

    shouldHandleEvent(action: string): boolean {
        return ['delete', 'untag', 'pull', 'tag', 'build'].includes(action);
    }

    isDestroyAction(action: string): boolean {
        return action === 'delete';
    }

    hasStateChanged(oldState: Image, newState: Image): boolean {
        return (
            JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags) ||
            oldState.size !== newState.size ||
            oldState.containersUsed !== newState.containersUsed ||
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels)
        );
    }

    emitInitialState(state: Image): void {
        this.docker
            .getImage(this.resourceId)
            .history()
            .then((raw) => {
                const history = this.parseHistory(raw);
                const event: ImageDetailEvent = {
                    type: 'initial-state',
                    imageId: this.resourceId,
                    image: state,
                    history,
                    timestamp: Date.now(),
                };
                this.emit('initial-state', event);
            })
            .catch(() => {
                const event: ImageDetailEvent = {
                    type: 'initial-state',
                    imageId: this.resourceId,
                    image: state,
                    history: [],
                    timestamp: Date.now(),
                };
                this.emit('initial-state', event);
            });
    }

    emitStateChange(newState: Image, oldState: Image): void {
        const event: ImageDetailEvent = {
            type: 'state-change',
            imageId: this.resourceId,
            image: newState,
            timestamp: Date.now(),
        };
        this.emit('state-change', event);
    }

    emitRemoved(oldState: Image): void {
        const event: ImageDetailEvent = {
            type: 'removed',
            imageId: this.resourceId,
            timestamp: Date.now(),
        };
        this.emit('removed', event);
    }

    protected getCustomStats(): Record<string, any> {
        return {
            currentState: this.currentState?.repoTags,
            hasState: this.currentState !== null,
        };
    }

    private parseHistory(raw: any[]): ImageHistoryEntry[] {
        return raw.map((entry) => ({
            id: entry.Id || '<missing>',
            created: entry.Created || 0,
            createdBy: entry.CreatedBy || '',
            size: entry.Size || 0,
            comment: entry.Comment || '',
            tags: entry.Tags || null,
        }));
    }

    private parseImageInspect(info: ImageInspectInfo): Image {
        const rawNames = info.RepoTags?.map((t) => t.split(':')[0]) ?? [];
        const rawTags = info.RepoTags?.map((t) => t.split(':')[1]) ?? [];
        const name = rawNames.length ? rawNames : ['<none>'];
        const tag = rawTags.length ? rawTags : ['<none>'];
        const id = info.Id.split(':')[1];
        const cfg = info.Config;

        return {
            id,
            fullId: info.Id,
            name,
            tag,
            repoTags: info.RepoTags?.length ? info.RepoTags : ['<none>:<none>'],
            repoDigests: info.RepoDigests || [],
            created: new Date(info.Created).getTime(),
            size: info.Size,
            virtualSize: info.VirtualSize ?? info.Size,
            sharedSize: 0,
            labels: cfg?.Labels || {},
            containersUsed: 0,
            parent: info.Parent,
            architecture: info.Architecture,
            os: info.Os,
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
}
