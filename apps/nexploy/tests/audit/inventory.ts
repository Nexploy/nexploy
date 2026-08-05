import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { APP_ROOT } from '../setup/env';

export const ACTIONS_ROOT = join(APP_ROOT, 'src/actions');
export const ROUTES_ROOT = join(APP_ROOT, 'src/app/api');

export type EndpointKind = 'action' | 'route';

export interface EndpointGuard {
    resource: string;
    action: string;
    orgResolver: string | null;
}

export interface Endpoint {
    kind: EndpointKind;
    file: string;
    exportName: string;
    id: string;
    metadataName: string | null;
    httpMethod: string | null;
    authMiddleware: string | null;
    delegatesTo: string | null;
    guards: EndpointGuard[];
}

function walk(dir: string, matcher: (path: string) => boolean): string[] {
    const found: string[] = [];

    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);

        if (statSync(full).isDirectory()) {
            found.push(...walk(full, matcher));
            continue;
        }

        if (matcher(full)) found.push(full);
    }

    return found;
}

function splitExports(source: string): { exportName: string; body: string }[] {
    const marker = /export (?:const|async function|function) (?:(\w+)|\{([^}]+)\})\s*[=(]/g;
    const segments: { exportName: string; body: string }[] = [];
    const matches = [...source.matchAll(marker)];

    matches.forEach((match, index) => {
        const start = match.index ?? 0;
        const end = matches[index + 1]?.index ?? source.length;
        const body = source.slice(start, end);
        const destructuredNames = match[2];

        if (destructuredNames) {
            for (const name of destructuredNames
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean)) {
                segments.push({ exportName: name, body });
            }
            return;
        }

        segments.push({ exportName: match[1] ?? '', body });
    });

    return segments;
}

function parseGuards(body: string): EndpointGuard[] {
    const guards: EndpointGuard[] = [];
    const pattern = /requirePermission\(\s*'([^']+)'\s*,\s*'([^']+)'\s*(?:,\s*([A-Za-z_$][\w$]*))?/g;

    for (const match of body.matchAll(pattern)) {
        guards.push({ resource: match[1] ?? '', action: match[2] ?? '', orgResolver: match[3] ?? null });
    }

    return guards;
}

function parseAuthMiddleware(body: string): string | null {
    if (/\.use\(\s*authActionServer/.test(body) || /=\s*authActionServer/.test(body)) return 'authActionServer';
    if (/\.use\(\s*authRouteServer\s*\)/.test(body)) return 'authRouteServer';
    if (/\.use\(\s*internalApiAuth\(/.test(body)) return 'internalApiAuth';
    if (/\.use\(\s*webhookAuth/.test(body)) return 'webhookAuth';

    return null;
}

function parseDelegate(body: string): string | null {
    const destructured = body.match(/export const \{[^}]+\}\s*=\s*([A-Za-z_$][\w$.]*)/);
    if (destructured) return destructured[1] ?? null;

    const alias = body.match(/export const \w+\s*=\s*([A-Za-z_$][\w$]*)\s*;/);
    if (alias) return alias[1] ?? null;

    const fromFunction = body.match(/export (?:async )?function (\w+)/);
    if (fromFunction) return 'inlineFunction';

    return null;
}

function parseMetadataName(body: string): string | null {
    return body.match(/\.metadata\(\{\s*name:\s*'([^']+)'/)?.[1] ?? null;
}

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function collectActionEndpoints(): Endpoint[] {
    const files = walk(ACTIONS_ROOT, (path) => path.endsWith('.action.ts'));

    return files.flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const relativeFile = relative(APP_ROOT, file).split(sep).join('/');

        return splitExports(source)
            .filter(({ body }) => /actionServer|authActionServer/.test(body))
            .map(({ exportName, body }) => ({
                kind: 'action' as const,
                file: relativeFile,
                exportName,
                id: `${relativeFile}#${exportName}`,
                metadataName: parseMetadataName(body),
                httpMethod: null,
                authMiddleware: parseAuthMiddleware(body),
                delegatesTo: parseDelegate(body),
                guards: parseGuards(body),
            }));
    });
}

export function collectRouteEndpoints(): Endpoint[] {
    const files = walk(ROUTES_ROOT, (path) => path.endsWith(`${sep}route.ts`));

    return files.flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const relativeFile = relative(APP_ROOT, file).split(sep).join('/');

        return splitExports(source)
            .filter(({ exportName }) => HTTP_METHODS.has(exportName))
            .map(({ exportName, body }) => ({
                kind: 'route' as const,
                file: relativeFile,
                exportName,
                id: `${exportName} ${relativeFile}`,
                metadataName: null,
                httpMethod: exportName,
                authMiddleware: parseAuthMiddleware(body),
                delegatesTo: parseDelegate(body),
                guards: parseGuards(body),
            }));
    });
}

export function collectEndpoints(): Endpoint[] {
    return [...collectActionEndpoints(), ...collectRouteEndpoints()].sort((a, b) => a.id.localeCompare(b.id));
}

export function routePathOf(endpoint: Endpoint): string {
    return endpoint.file.replace('src/app', '').replace('/route.ts', '') || '/';
}
