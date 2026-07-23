import { terminalSchema } from '@workspace/schemas-zod/websocket/terminal.schema';
import { attachSchema } from '@workspace/schemas-zod/websocket/attach.schema';
import type { MatchResult, WSRouteConfig } from '@workspace/typescript-interface/websocket';

export const WS_PROXY_PREFIX = '/_ws/docker';

export const WS_ROUTE_CONFIGS: WSRouteConfig[] = [
    {
        prefix: `${WS_PROXY_PREFIX}/terminal`,
        params: ['containerId', 'shell'],
        paramSpecs: {
            containerId: { optional: false },
            shell: { optional: true, default: 'auto' },
        },
        zodSchema: terminalSchema,
        transform: (params) => `/ws/docker/terminal/${params.containerId}/${params.shell}`,
    },
    {
        prefix: `${WS_PROXY_PREFIX}/attach`,
        params: ['containerId'],
        paramSpecs: {
            containerId: { optional: false },
        },
        zodSchema: attachSchema,
        transform: (params) => `/ws/docker/attach/${params.containerId}`,
    },
];

export function extractContainerId(pathname: string): string | null {
    for (const config of WS_ROUTE_CONFIGS) {
        if (pathname.startsWith(config.prefix)) {
            const suffix = pathname.substring(config.prefix.length);
            const parts = suffix.split('/').filter(Boolean);
            const idx = config.params.indexOf('containerId');
            return idx >= 0 ? (parts[idx] ?? null) : null;
        }
    }

    return null;
}

export function matchAndTransformWsUrl(pathname: string): MatchResult {
    for (const config of WS_ROUTE_CONFIGS) {
        if (pathname.startsWith(config.prefix)) {
            const suffix = pathname.substring(config.prefix.length);
            if (config.params.length === 0) {
                if (suffix === '') {
                    return { matched: true, url: config.transform({}), original: pathname };
                }
                continue;
            }

            const parts = suffix.split('/').filter(Boolean);
            const paramsObj: Record<string, string | undefined> = {};
            for (let i = 0; i < config.params.length; i++) {
                const paramName = config.params[i] as string;
                const spec = config.paramSpecs[paramName];
                if (i < parts.length) {
                    paramsObj[paramName] = parts[i];
                } else if (spec?.optional && spec?.default !== undefined) {
                    paramsObj[paramName] = spec.default;
                } else {
                    return { matched: false };
                }
            }

            if (config.zodSchema) {
                const validation = config.zodSchema.safeParse(paramsObj);
                if (!validation.success) {
                    console.error(`Error validation ${pathname}:`, validation.error.format());
                    return { matched: false };
                }
            }

            return {
                matched: true,
                url: config.transform(paramsObj as Record<string, string>),
                original: pathname,
            };
        }
    }

    return { matched: false };
}
