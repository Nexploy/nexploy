import { AsyncLocalStorage } from 'async_hooks';
import { isForbiddenError } from '@/lib/activity/forbiddenError';

interface ErrorKind {
    forbidden: boolean;
}

const errorKindStorage = new AsyncLocalStorage<ErrorKind>();

export function runWithErrorKind<T>(fn: () => Promise<T>): Promise<T> {
    return errorKindStorage.run({ forbidden: false }, fn);
}

export function markErrorKind(error: unknown): void {
    const store = errorKindStorage.getStore();
    if (store && isForbiddenError(error)) store.forbidden = true;
}

export function wasForbidden(): boolean {
    return errorKindStorage.getStore()?.forbidden ?? false;
}
