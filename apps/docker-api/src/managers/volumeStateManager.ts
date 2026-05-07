import { VolumeInspectInfo } from 'dockerode';
import { Volume, VolumeDetailEvent } from '@workspace/typescript-interface/docker/docker.volume';
import { BaseSingleResourceStateManager } from '@/lib/BaseSingleResourceStateManager';

export class VolumeStateManager extends BaseSingleResourceStateManager<Volume> {
    constructor(volumeName: string, environmentId: string) {
        super({
            resourceType: 'Volume',
            resourceId: volumeName,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 50,
        });
    }

    async fetchResourceState(): Promise<Volume> {
        const info = await this.docker.getVolume(this.resourceId).inspect();
        return this.parseVolumeInfo(info);
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['volume'],
            volume: [this.resourceId],
        };
    }

    shouldHandleEvent(action: string): boolean {
        return ['create', 'mount', 'unmount'].includes(action);
    }

    isDestroyAction(action: string): boolean {
        return action === 'destroy';
    }

    hasStateChanged(oldState: Volume, newState: Volume): boolean {
        return (
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels) ||
            JSON.stringify(oldState.options) !== JSON.stringify(newState.options) ||
            JSON.stringify(oldState.usageData) !== JSON.stringify(newState.usageData)
        );
    }

    emitInitialState(state: Volume): void {
        const event: VolumeDetailEvent = {
            type: 'initial-state',
            volumeName: this.resourceId,
            volume: state,
            timestamp: Date.now(),
        };
        this.emit('initial-state', event);
    }

    emitStateChange(newState: Volume, _oldState: Volume): void {
        const event: VolumeDetailEvent = {
            type: 'state-change',
            volumeName: this.resourceId,
            volume: newState,
            timestamp: Date.now(),
        };
        this.emit('state-change', event);
    }

    emitRemoved(_oldState: Volume): void {
        const event: VolumeDetailEvent = {
            type: 'removed',
            volumeName: this.resourceId,
            timestamp: Date.now(),
        };
        this.emit('removed', event);
    }

    protected getCustomStats(): Record<string, any> {
        return {
            currentState: this.currentState?.name,
            hasState: this.currentState !== null,
        };
    }

    private parseVolumeInfo(volume: VolumeInspectInfo): Volume {
        return {
            name: volume.Name || '<none>',
            driver: volume.Driver,
            mountpoint: volume.Mountpoint,
            createdAt: Date.now(),
            labels: volume.Labels || {},
            scope: volume.Scope || 'local',
            options: volume.Options || {},
            usageData: volume.UsageData,
            timestamp: Date.now(),
        };
    }
}
