import type { GitProviderType } from 'generated/client';
import { getInstancePublicUrl } from '@/lib/instance/publicUrl';
import { prisma } from '../../../prisma/prisma';

export type InstanceCallbackKind = 'oauthCallback' | 'setupRedirect' | 'webhook' | 'homepage';

export interface InstanceCallbackUrl {
    kind: InstanceCallbackKind;
    value: string;
    automatic: boolean;
}

export interface InstanceCallbackTarget {
    providerId: string;
    provider: GitProviderType;
    displayName: string;
    isGitHubApp: boolean;
    settingsUrl: string | null;
    urls: InstanceCallbackUrl[];
}

export { getInstancePublicUrl };

function githubAppSettingsUrl(appName: string | null, ownerName: string | null, ownerType: string | null): string {
    if (!appName) return 'https://github.com/settings/apps';
    if (ownerType === 'Organization' && ownerName) {
        return `https://github.com/organizations/${ownerName}/settings/apps/${appName}`;
    }
    return `https://github.com/settings/apps/${appName}`;
}

function resolveSettingsUrl(provider: {
    provider: GitProviderType;
    appId: string | null;
    appName: string | null;
    ownerName: string | null;
    ownerType: string | null;
    baseUrl: string | null;
}): string | null {
    const baseUrl = provider.baseUrl?.replace(/\/+$/, '') ?? '';

    switch (provider.provider) {
        case 'GITHUB':
            return provider.appId
                ? githubAppSettingsUrl(provider.appName, provider.ownerName, provider.ownerType)
                : 'https://github.com/settings/developers';
        case 'GITLAB':
            return baseUrl ? `${baseUrl}/-/user_settings/applications` : null;
        case 'GITEA':
            return baseUrl ? `${baseUrl}/user/settings/applications` : null;
        case 'BITBUCKET':
            return provider.ownerName
                ? `https://bitbucket.org/${provider.ownerName}/workspace/settings/api`
                : 'https://bitbucket.org/account/settings/';
        case 'AZURE_REPOS':
            return 'https://app.vsaex.visualstudio.com/app/list';
        default:
            return null;
    }
}

function buildUrls(publicUrl: string, isGitHubApp: boolean): InstanceCallbackUrl[] {
    const urls: InstanceCallbackUrl[] = [
        { kind: 'oauthCallback', value: `${publicUrl}/api/git/oauth/callback`, automatic: false },
    ];

    if (isGitHubApp) {
        urls.push(
            { kind: 'setupRedirect', value: `${publicUrl}/api/providers/github/setup`, automatic: false },
            { kind: 'homepage', value: publicUrl, automatic: false },
            { kind: 'webhook', value: `${publicUrl}/api/webhooks/github`, automatic: true },
        );
    }

    return urls;
}

export async function getInstanceCallbackTargets(): Promise<InstanceCallbackTarget[]> {
    const publicUrl = getInstancePublicUrl();
    if (!publicUrl) return [];

    const providers = await prisma.gitProvider.findMany({
        where: { enabled: true },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            provider: true,
            displayName: true,
            appId: true,
            appName: true,
            ownerName: true,
            ownerType: true,
            baseUrl: true,
        },
    });

    return providers.map((provider) => {
        const isGitHubApp = provider.provider === 'GITHUB' && Boolean(provider.appId);

        return {
            providerId: provider.id,
            provider: provider.provider,
            displayName: provider.displayName,
            isGitHubApp,
            settingsUrl: resolveSettingsUrl(provider),
            urls: buildUrls(publicUrl, isGitHubApp),
        };
    });
}
