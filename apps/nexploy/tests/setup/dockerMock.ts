type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface DockerCall {
    method: Method;
    path: string;
    options?: Record<string, unknown>;
}

type Responder = (call: DockerCall) => unknown;

const responders = new Map<string, Responder>();
let fallback: Responder = () => ({});

export const dockerCalls: DockerCall[] = [];

function key(method: Method, path: string) {
    return `${method.toUpperCase()} ${path}`;
}

export function mockDocker(method: Method, path: string, responder: Responder | unknown) {
    responders.set(key(method, path), typeof responder === 'function' ? (responder as Responder) : () => responder);
}

export function mockDockerFallback(responder: Responder) {
    fallback = responder;
}

export function resetDockerMock() {
    responders.clear();
    dockerCalls.length = 0;
    fallback = () => ({});
}

function resolve(call: DockerCall): unknown {
    const exact = responders.get(key(call.method, call.path));
    if (exact) return exact(call);

    for (const [pattern, responder] of responders) {
        const [method, template] = pattern.split(' ');
        if (!template || method !== call.method.toUpperCase()) continue;

        const regex = new RegExp(`^${template.replace(/:[^/]+/g, '[^/]+')}$`);
        if (regex.test(call.path)) return responder(call);
    }

    return fallback(call);
}

function respond(method: Method) {
    return (path: string, options?: Record<string, unknown>) => {
        const call: DockerCall = { method, path, options };
        dockerCalls.push(call);

        const body = resolve(call);
        const promise = Promise.resolve(body) as Promise<unknown> & {
            json: <T>() => Promise<T>;
            text: () => Promise<string>;
        };

        promise.json = <T>() => Promise.resolve(body as T);
        promise.text = () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body));

        return promise;
    };
}

export const kyDockerMock = {
    get: respond('get'),
    post: respond('post'),
    put: respond('put'),
    patch: respond('patch'),
    delete: respond('delete'),
    extend: () => kyDockerMock,
    create: () => kyDockerMock,
};
