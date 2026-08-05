import { EventEmitter } from 'node:events';
import type { ActivityLogEntry, ActivityPurgeResult } from '@workspace/typescript-interface/activity';

const CREATED_EVENT = 'activity-created';
const PURGED_EVENT = 'activity-purged';

const globalForActivityBus = globalThis as unknown as { activityBus: EventEmitter | undefined };

const activityBus =
    globalForActivityBus.activityBus ??
    (() => {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(0);

        return emitter;
    })();

globalForActivityBus.activityBus = activityBus;

export function publishActivityCreated(entry: ActivityLogEntry): void {
    activityBus.emit(CREATED_EVENT, entry);
}

export function publishActivityPurged(result: ActivityPurgeResult): void {
    activityBus.emit(PURGED_EVENT, result);
}

export function subscribeActivityCreated(listener: (entry: ActivityLogEntry) => void): () => void {
    activityBus.on(CREATED_EVENT, listener);

    return () => {
        activityBus.off(CREATED_EVENT, listener);
    };
}

export function subscribeActivityPurged(listener: (result: ActivityPurgeResult) => void): () => void {
    activityBus.on(PURGED_EVENT, listener);

    return () => {
        activityBus.off(PURGED_EVENT, listener);
    };
}
