import { logger } from '@/utils/logger';
import { BaseSingleResourceStateManager } from '@/lib/base/BaseSingleResourceStateManager';

interface RegistryEntry<TManager> {
    manager: TManager;
    refCount: number;
    startPromise: Promise<void>;
}

export class SingleResourceManagerRegistry<TManager extends BaseSingleResourceStateManager<any>> {
    private readonly instances = new Map<string, RegistryEntry<TManager>>();
    private readonly resourceType: string;

    constructor(
        resourceType: string,
        private readonly factory: (resourceId: string, environmentId: string) => TManager,
    ) {
        this.resourceType = resourceType;
    }

    async acquire(resourceId: string, environmentId: string): Promise<TManager> {
        const key = `${environmentId}:${resourceId}`;
        const entry = this.instances.get(key);

        if (entry) {
            entry.refCount++;
            logger.debug(
                { resourceId, refCount: entry.refCount },
                `Reusing existing ${this.resourceType} manager`,
            );
            await entry.startPromise;
            return entry.manager;
        }

        const manager = this.factory(resourceId, environmentId);

        const startPromise = manager.start();
        this.instances.set(key, { manager, refCount: 1, startPromise });

        logger.debug({ resourceId }, `Created new ${this.resourceType} manager`);
        await startPromise;
        return manager;
    }

    release(resourceId: string, environmentId: string): void {
        const key = `${environmentId}:${resourceId}`;
        const entry = this.instances.get(key);

        if (!entry) return;

        entry.refCount--;
        logger.debug(
            { resourceId, refCount: entry.refCount },
            `Released ${this.resourceType} manager reference`,
        );

        if (entry.refCount <= 0) {
            entry.manager.stop();
            this.instances.delete(key);
            logger.debug({ resourceId }, `Stopped and removed ${this.resourceType} manager`);
        }
    }

    getStats(): { key: string; refCount: number }[] {
        return Array.from(this.instances.entries()).map(([key, entry]) => ({
            key,
            refCount: entry.refCount,
        }));
    }
}
