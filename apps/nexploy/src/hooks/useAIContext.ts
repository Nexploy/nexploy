'use client';

import { useTranslations } from 'next-intl';

export interface AISuggestionCategory {
    id: string;
    label: string;
    suggestions: string[];
}

export interface AIContext {
    categories: AISuggestionCategory[];
}

const CATEGORY_KEYS: { id: string; keys: string[] }[] = [
    {
        id: 'containers',
        keys: [
            'suggestions.containers.listRunning',
            'suggestions.containers.showLogs',
            'suggestions.containers.execCommand',
            'suggestions.containers.cleanupStopped',
        ],
    },
    {
        id: 'images',
        keys: [
            'suggestions.images.listWithSizes',
            'suggestions.images.pullImage',
            'suggestions.images.scanVulnerabilities',
            'suggestions.images.pruneDangling',
        ],
    },
    {
        id: 'volumes',
        keys: [
            'suggestions.volumes.listVolumes',
            'suggestions.volumes.createVolume',
            'suggestions.volumes.pruneUnused',
        ],
    },
    {
        id: 'networks',
        keys: [
            'suggestions.networks.listNetworks',
            'suggestions.networks.createBridge',
            'suggestions.networks.inspectNetwork',
        ],
    },
    {
        id: 'compose',
        keys: [
            'suggestions.compose.listContainers',
            'suggestions.compose.restartStack',
            'suggestions.compose.teardownStack',
        ],
    },
    {
        id: 'repositories',
        keys: [
            'suggestions.repositories.listWithStatus',
            'suggestions.repositories.showFailing',
            'suggestions.repositories.triggerBuild',
            'suggestions.repositories.showEnvVars',
        ],
    },
    {
        id: 'repository',
        keys: [
            'suggestions.repository.triggerBuild',
            'suggestions.repository.showBuildLogs',
            'suggestions.repository.cancelBuild',
            'suggestions.repository.setEnvVar',
        ],
    },
    {
        id: 'build',
        keys: [
            'suggestions.build.whyFailed',
            'suggestions.build.showNodeLogs',
            'suggestions.build.cancelBuild',
            'suggestions.build.listBuilds',
        ],
    },
    {
        id: 'ssl',
        keys: [
            'suggestions.ssl.listCertificates',
            'suggestions.ssl.issueLetsEncrypt',
            'suggestions.ssl.deleteExpired',
        ],
    },
    {
        id: 'registries',
        keys: [
            'suggestions.registries.listRegistries',
            'suggestions.registries.addRegistry',
            'suggestions.registries.deleteRegistry',
        ],
    },
    {
        id: 'environments',
        keys: [
            'suggestions.environments.listEnvironments',
            'suggestions.environments.addRemoteHost',
            'suggestions.environments.setDefault',
        ],
    },
    {
        id: 'swarm',
        keys: [
            'suggestions.swarm.listNodes',
            'suggestions.swarm.listServices',
            'suggestions.swarm.scaleService',
            'suggestions.swarm.drainNode',
        ],
    },
];

export function useAIContext(): AIContext {
    const t = useTranslations('ai.context');

    return {
        categories: CATEGORY_KEYS.map(({ id, keys }) => ({
            id,
            label: t(`suggestions.categories.${id}` as Parameters<typeof t>[0]),
            suggestions: keys.map((key) => t(key as Parameters<typeof t>[0])),
        })),
    };
}
