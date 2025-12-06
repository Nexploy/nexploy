import { AsyncLocalStorage } from 'async_hooks';
import { GetGitProviderToken } from '@workspace/typescript-interface/git';

export const tokenStorage = new AsyncLocalStorage<GetGitProviderToken>();

export const getTokenStorage = () => {
    const store = tokenStorage.getStore();
    if (!store) {
        throw new Error('Token storage not found. Must be inside tokenStorage.run().');
    }
    return store;
};
