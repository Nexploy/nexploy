import { AsyncLocalStorage } from 'async_hooks';
import { type Actor, SYSTEM_ACTOR } from '@nexploy/shared/actor';

export const actorContextStorage = new AsyncLocalStorage<Actor>();

export function runWithActor<T>(actor: Actor, fn: () => T): T {
    return actorContextStorage.run(actor, fn);
}

export function getCurrentActor(): Actor {
    return actorContextStorage.getStore() ?? SYSTEM_ACTOR;
}

export function isUserAction(): boolean {
    return getCurrentActor().source === 'user';
}
