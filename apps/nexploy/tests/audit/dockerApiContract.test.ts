import { describe, expect, it } from 'vitest';
import {
    collectDockerApiCalls,
    collectDockerApiRoutes,
    findRoute,
    type DockerApiCall,
    type HttpMethod,
} from './dockerApiContract';

const routes = collectDockerApiRoutes();
const calls = collectDockerApiCalls();

interface DynamicCall {
    method: HttpMethod;
    path: string;
    values: string[];
    reason: string;
}

const DYNAMIC_CALLS: DynamicCall[] = [
    {
        method: 'post',
        path: '/api/images/:param',
        values: ['pull', 'push', 'tag', 'untag', 'delete', 'import', 'load', 'save'],
        reason: 'onImageAction interpolates the action name from imageActionsSchema into the path',
    },
    {
        method: 'post',
        path: '/api/container/:param',
        values: ['start', 'stop', 'restart'],
        reason: 'The MCP container tool interpolates the action name into the path (remove goes through DELETE)',
    },
    {
        method: 'post',
        path: '/api/networks/:param',
        values: ['delete', 'prune'],
        reason: 'onNetworkAction interpolates the action name from networkActionsSchema into the path',
    },
    {
        method: 'post',
        path: '/api/volumes/:param',
        values: ['delete', 'prune'],
        reason: 'onVolumeAction interpolates the action name from volumeActionsSchema into the path',
    },
    {
        method: 'post',
        path: '/api/composes/:param/:param',
        values: ['start', 'stop', 'restart', 'pause', 'unpause', 'remove'],
        reason: 'composeAction interpolates the stack name and the action name into the path',
    },
    {
        method: 'post',
        path: '/api/swarm/nodes/:param/:param',
        values: ['promote', 'demote', 'drain', 'activate', 'pause'],
        reason: 'The MCP swarm tool interpolates the node id and the action name into the path',
    },
];

const KNOWN_CONTRACT_GAPS: Record<string, string> = {};

function expand(path: string, value: string): string {
    const lastParam = path.lastIndexOf(':param');

    return `${path.slice(0, lastParam)}${value}${path.slice(lastParam + ':param'.length)}`;
}

function isDynamic(call: DockerApiCall): boolean {
    return DYNAMIC_CALLS.some((dynamic) => dynamic.method === call.method && dynamic.path === call.path);
}

function label(call: { method: HttpMethod; path: string }): string {
    return `${call.method.toUpperCase()} ${call.path}`;
}

describe('docker-api contract', () => {
    it('discovers the routes docker-api declares', () => {
        expect(routes.length).toBeGreaterThan(100);
    });

    it('discovers the docker-api calls nexploy makes', () => {
        expect(calls.length).toBeGreaterThan(40);
    });

    it('matches every static call to a route docker-api declares', () => {
        const unmatched = calls
            .filter((call) => !isDynamic(call))
            .filter((call) => !findRoute(call, routes))
            .filter((call) => !KNOWN_CONTRACT_GAPS[label(call)])
            .map((call) => `${label(call)} — ${call.file}:${call.line}`);

        expect(unmatched, 'nexploy calls a docker-api route that does not exist; check the verb and the path').toEqual(
            [],
        );
    });

    it('matches every value a dynamic call can take', () => {
        const broken: string[] = [];

        for (const dynamic of DYNAMIC_CALLS) {
            for (const value of dynamic.values) {
                const candidate: DockerApiCall = {
                    method: dynamic.method,
                    path: expand(dynamic.path, value),
                    file: 'dynamic',
                    line: 0,
                };

                if (findRoute(candidate, routes)) continue;
                if (KNOWN_CONTRACT_GAPS[label(candidate)]) continue;

                broken.push(`${label(candidate)} — ${dynamic.reason}`);
            }
        }

        expect(broken, 'this input value builds a path docker-api does not serve').toEqual([]);
    });

    it('keeps every declared dynamic call site alive in the source', () => {
        const stale = DYNAMIC_CALLS.filter(
            (dynamic) => !calls.some((call) => call.method === dynamic.method && call.path === dynamic.path),
        ).map((dynamic) => label(dynamic));

        expect(stale, 'remove these entries from DYNAMIC_CALLS').toEqual([]);
    });

    it('keeps the known gaps list free of entries that now resolve', () => {
        const fixed = Object.keys(KNOWN_CONTRACT_GAPS).filter((key) => {
            const [method, path] = key.split(' ');

            return findRoute(
                { method: (method ?? '').toLowerCase() as HttpMethod, path: path ?? '', file: '', line: 0 },
                routes,
            );
        });

        expect(fixed, 'docker-api serves these now, drop them from KNOWN_CONTRACT_GAPS').toEqual([]);
    });

    it('reports the calls that reach no docker-api route', () => {
        expect(Object.entries(KNOWN_CONTRACT_GAPS).map(([key, reason]) => `${key} — ${reason}`)).toMatchSnapshot();
    });

    it('records the calls nexploy makes, so a change to the contract is visible', () => {
        const contract = calls.map((call) => label(call));

        expect([...new Set(contract)].sort()).toMatchSnapshot();
    });

    it('records the routes docker-api serves but nexploy never calls', () => {
        const unused = routes
            .filter((route) => !calls.some((call) => findRoute(call, [route])))
            .filter((route) => !isDynamicallyReached(route.method, route.path))
            .map((route) => label(route));

        expect([...new Set(unused)].sort()).toMatchSnapshot();
    });
});

function isDynamicallyReached(method: HttpMethod, path: string): boolean {
    return DYNAMIC_CALLS.some(
        (dynamic) => dynamic.method === method && dynamic.values.some((value) => expand(dynamic.path, value) === path),
    );
}
