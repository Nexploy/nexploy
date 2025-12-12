import { AsyncLocalStorage } from 'async_hooks';
import { GitProviderToken } from '@workspace/typescript-interface/git/git';

export const tokenGitStorage = new AsyncLocalStorage<GitProviderToken>();

export const getTokenGitStorage = () => {
    const store = tokenGitStorage.getStore();
    if (!store) {
        throw new Error('Token storage not found. Must be inside tokenStorage.run().');
    }
    return store;
};
