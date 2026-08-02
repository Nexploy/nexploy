export interface DockerRequestOptions {
    json?: unknown;
    searchParams?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
    timeout?: number | false;
    signal?: AbortSignal;
    throwHttpErrors?: boolean;
    environmentId?: string;
}

export interface DockerResponsePromise extends Promise<Response> {
    json<T>(): Promise<T>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}

export interface DockerApiClient {
    get(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    post(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    put(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    patch(url: string, options?: DockerRequestOptions): DockerResponsePromise;
    delete(url: string, options?: DockerRequestOptions): DockerResponsePromise;
}

export interface NodeHostServices {
    docker: DockerApiClient;
}
