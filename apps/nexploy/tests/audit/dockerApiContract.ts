import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { APP_ROOT, REPO_ROOT } from '../setup/env';

const DOCKER_API_ROOT = join(REPO_ROOT, 'apps/docker-api');
const DOCKER_API_SRC = join(DOCKER_API_ROOT, 'src');
const NEXPLOY_SRC = join(APP_ROOT, 'src');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface DockerApiRoute {
    method: HttpMethod;
    path: string;
    file: string;
}

export interface DockerApiCall {
    method: HttpMethod;
    path: string;
    file: string;
    line: number;
}

function walk(dir: string, matcher: (path: string) => boolean): string[] {
    if (!existsSync(dir)) return [];

    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return walk(full, matcher);
        return matcher(full) ? [full] : [];
    });
}

function resolveImport(fromFile: string, specifier: string): string | null {
    const base = specifier.startsWith('@/')
        ? join(DOCKER_API_SRC, specifier.slice(2))
        : specifier.startsWith('.')
          ? resolve(dirname(fromFile), specifier)
          : null;

    if (!base) return null;

    for (const candidate of [`${base}.ts`, join(base, 'index.ts')]) {
        if (existsSync(candidate)) return candidate;
    }

    return null;
}

function importMap(file: string, source: string): Map<string, string> {
    const imports = new Map<string, string>();

    for (const match of source.matchAll(/import\s+(\w+)\s+from\s+'([^']+)'/g)) {
        const resolved = resolveImport(file, match[2] ?? '');
        if (resolved) imports.set(match[1] ?? '', resolved);
    }

    return imports;
}

function normalize(path: string): string {
    const collapsed = `/${path.split('/').filter(Boolean).join('/')}`;
    return collapsed === '/' ? '/' : collapsed;
}

function collectFromRouter(file: string, prefix: string, seen: Set<string>): DockerApiRoute[] {
    const key = `${prefix}::${file}`;
    if (seen.has(key)) return [];
    seen.add(key);

    const source = readFileSync(file, 'utf8');
    const imports = importMap(file, source);
    const routes: DockerApiRoute[] = [];

    for (const match of source.matchAll(/app\.route\(\s*'([^']*)'\s*,\s*(\w+)/g)) {
        const target = imports.get(match[2] ?? '');
        if (target) routes.push(...collectFromRouter(target, normalize(`${prefix}/${match[1]}`), seen));
    }

    const methodPattern = new RegExp(`app\\.(${HTTP_METHODS.join('|')})\\(\\s*'([^']*)'`, 'g');

    for (const match of source.matchAll(methodPattern)) {
        routes.push({
            method: match[1] as HttpMethod,
            path: normalize(`${prefix}/${match[2]}`),
            file: relative(REPO_ROOT, file).split(sep).join('/'),
        });
    }

    return routes;
}

export function collectDockerApiRoutes(): DockerApiRoute[] {
    const entry = join(DOCKER_API_SRC, 'index.ts');

    return collectFromRouter(entry, '', new Set()).sort(
        (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
    );
}

export function collectDockerApiCalls(): DockerApiCall[] {
    const files = walk(NEXPLOY_SRC, (path) => path.endsWith('.ts') || path.endsWith('.tsx'));
    const pattern = new RegExp(`kyDocker\\s*\\.\\s*(${HTTP_METHODS.join('|')})\\(\\s*[\`']([^\`']+)[\`']`, 'g');

    return files
        .flatMap((file) => {
            const source = readFileSync(file, 'utf8');

            return [...source.matchAll(pattern)].map((match) => ({
                method: match[1] as HttpMethod,
                path: normalize(`/api/${(match[2] ?? '').replace(/\$\{[^}]*\}/g, ':param')}`),
                file: relative(APP_ROOT, file).split(sep).join('/'),
                line: source.slice(0, match.index ?? 0).split('\n').length,
            }));
        })
        .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function segmentsMatch(callSegment: string, routeSegment: string): boolean {
    if (routeSegment.startsWith(':')) return true;
    if (routeSegment === '*') return true;

    return callSegment === routeSegment;
}

export function matchesRoute(call: DockerApiCall, route: DockerApiRoute): boolean {
    if (call.method !== route.method) return false;

    const callSegments = call.path.split('/').filter(Boolean);
    const routeSegments = route.path.split('/').filter(Boolean);

    if (routeSegments.at(-1) === '*') {
        return routeSegments
            .slice(0, -1)
            .every(
                (segment, index) =>
                    callSegments[index] !== undefined && segmentsMatch(callSegments[index] as string, segment),
            );
    }

    if (callSegments.length !== routeSegments.length) return false;

    return routeSegments.every((segment, index) => segmentsMatch(callSegments[index] as string, segment));
}

export function findRoute(call: DockerApiCall, routes: DockerApiRoute[]): DockerApiRoute | undefined {
    return routes.find((route) => matchesRoute(call, route));
}
