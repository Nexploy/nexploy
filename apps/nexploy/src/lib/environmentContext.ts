import { AsyncLocalStorage } from 'async_hooks';

interface EnvironmentContext {
    environmentId: string;
}

export const environmentContextStorage = new AsyncLocalStorage<EnvironmentContext>();

export function getCurrentEnvironmentId(): string | undefined {
    const context = environmentContextStorage.getStore();
    return context?.environmentId;
}

export function runWithEnvironmentContext<T>(environmentId: string, fn: () => T): T {
    const context: EnvironmentContext = { environmentId };
    return environmentContextStorage.run(context, fn);
}

export async function runWithEnvironmentContextAsync<T>(
    environmentId: string,
    fn: () => Promise<T>,
): Promise<T> {
    const context: EnvironmentContext = { environmentId };
    return environmentContextStorage.run(context, fn);
}
