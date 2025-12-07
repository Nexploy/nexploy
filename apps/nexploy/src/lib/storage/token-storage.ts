import { AsyncLocalStorage } from 'async_hooks';
import { GitProviderToken } from '@workspace/typescript-interface/git/git';

export const tokenStorage = new AsyncLocalStorage<GitProviderToken>();

export const getTokenStorage = () => {
    const store = tokenStorage.getStore();
    if (!store) {
        throw new Error('Token storage not found. Must be inside tokenStorage.run().');
    }
    return store;
};
