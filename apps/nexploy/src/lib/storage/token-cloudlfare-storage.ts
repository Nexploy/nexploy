import { AsyncLocalStorage } from 'async_hooks';
import { CloudflareToken } from '@workspace/typescript-interface/cloudflare/cloudflare';

export const tokenCloudflareStorage = new AsyncLocalStorage<CloudflareToken>();

export const getTokenCloudflareStorage = () => {
    const store = tokenCloudflareStorage.getStore();
    if (!store) {
        throw new Error('Token storage not found. Must be inside tokenStorage.run().');
    }
    return store;
};
