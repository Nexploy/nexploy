'use client';

import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export interface AIContext {
    suggestions: string[];
}

function stripLocale(pathname: string) {
    return pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
}

type RouteConfig = {
    match: (path: string, repositoryId?: string) => boolean;
    keys: string[];
};

const ROUTE_CONFIGS: RouteConfig[] = [
    {
        match: (path) => path.startsWith('/docker/containers'),
        keys: [
            'suggestions.containers.listStopped',
            'suggestions.containers.createPostgres',
            'suggestions.containers.showLogs',
            'suggestions.containers.restartFailing',
            'suggestions.containers.cleanupStopped',
        ],
    },
    {
        match: (path) => path.startsWith('/docker/images'),
        keys: [
            'suggestions.images.pullNginx',
            'suggestions.images.pullPostgres',
            'suggestions.images.listUnused',
            'suggestions.images.buildCustom',
        ],
    },
    {
        match: (path) => path.startsWith('/docker/volumes'),
        keys: [
            'suggestions.volumes.createVolume',
            'suggestions.volumes.listVolumes',
            'suggestions.volumes.inspectVolume',
        ],
    },
    {
        match: (path) => path.startsWith('/docker/networks'),
        keys: [
            'suggestions.networks.createBridge',
            'suggestions.networks.listNetworks',
            'suggestions.networks.connectContainer',
        ],
    },
    {
        match: (path, repositoryId) => !!repositoryId && path.includes('/pipeline'),
        keys: [
            'suggestions.pipeline.addLintStep',
            'suggestions.pipeline.deployStaging',
            'suggestions.pipeline.addNotification',
            'suggestions.pipeline.createPreview',
            'suggestions.pipeline.saveBuildLogs',
        ],
    },
    {
        match: (path, repositoryId) =>
            !!repositoryId && !!path.match(/\/repositories\/[^/]+\/[^/]+$/),
        keys: [
            'suggestions.build.showLogs',
            'suggestions.build.redeploy',
            'suggestions.build.debugFailed',
            'suggestions.build.comparePrevious',
        ],
    },
    {
        match: (_path, repositoryId) => !!repositoryId,
        keys: [
            'suggestions.repository.triggerBuild',
            'suggestions.repository.showBuildLogs',
            'suggestions.repository.changeBranch',
            'suggestions.repository.rollback',
            'suggestions.repository.envVars',
        ],
    },
    {
        match: (path) => path.startsWith('/repositories'),
        keys: [
            'suggestions.repositories.listRepos',
            'suggestions.repositories.showFailed',
            'suggestions.repositories.triggerBuild',
            'suggestions.repositories.showStatus',
        ],
    },
    {
        match: (path) => path.startsWith('/monitoring'),
        keys: [
            'suggestions.monitoring.cpuUsage',
            'suggestions.monitoring.memoryUsage',
            'suggestions.monitoring.logsAlert',
        ],
    },
    {
        match: (path) => path.startsWith('/swarm'),
        keys: [
            'suggestions.swarm.listNodes',
            'suggestions.swarm.listServices',
            'suggestions.swarm.deployService',
        ],
    },
];

const DEFAULT_KEYS = [
    'suggestions.default.listContainers',
    'suggestions.default.listRepositories',
    'suggestions.default.showStopped',
    'suggestions.default.listImages',
    'suggestions.default.triggerBuild',
];

export function useAIContext(): AIContext {
    const pathname = usePathname();
    const params = useParams<{ repositoryId?: string }>();
    const t = useTranslations('ai.context');

    const path = stripLocale(pathname);
    const repositoryId = params?.repositoryId;

    const config = ROUTE_CONFIGS.find(({ match }) => match(path, repositoryId));
    const keys = config?.keys ?? DEFAULT_KEYS;

    return {
        suggestions: keys.map((key) => t(key as Parameters<typeof t>[0])),
    };
}
