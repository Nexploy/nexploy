import { AsyncLocalStorage } from 'async_hooks';
import { AwsCredentials } from '@workspace/typescript-interface/aws/aws';

export const tokenAwsStorage = new AsyncLocalStorage<AwsCredentials>();

export const getTokenAwsStorage = () => {
    const store = tokenAwsStorage.getStore();
    if (!store) {
        throw new Error('AWS token storage not found. Must be inside tokenAwsStorage.run().');
    }
    return store;
};
