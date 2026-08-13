import type { GitProviderType } from 'generated/client';

export function getCommitUrl(
    repositoryUrl: string | null | undefined,
    gitProvider: GitProviderType | null | undefined,
    commitHash: string | null | undefined,
): string | null {
    if (!repositoryUrl || !gitProvider || !commitHash) return null;

    const baseUrl = repositoryUrl.replace(/\.git$/, '').replace(/\/$/, '');
    if (!/^https?:\/\//.test(baseUrl)) return null;

    switch (gitProvider) {
        case 'GITLAB':
            return `${baseUrl}/-/commit/${commitHash}`;
        case 'BITBUCKET':
            return `${baseUrl}/commits/${commitHash}`;
        case 'AZURE_REPOS':
            return `${baseUrl}/commit/${commitHash}`;
        default:
            return `${baseUrl}/commit/${commitHash}`;
    }
}

export function getHostname(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
