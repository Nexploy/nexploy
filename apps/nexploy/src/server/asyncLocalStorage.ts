import { AsyncLocalStorage } from 'async_hooks';

type GlobalWithAsyncLocalStorage = typeof globalThis & {
    AsyncLocalStorage?: typeof AsyncLocalStorage;
};

const globalWithAsyncLocalStorage = globalThis as GlobalWithAsyncLocalStorage;

if (typeof globalWithAsyncLocalStorage.AsyncLocalStorage !== 'function') {
    globalWithAsyncLocalStorage.AsyncLocalStorage = AsyncLocalStorage;
}
