import { ParsedRepoUrl } from '@/services/git/core/GitProviderAdapter';

function normalizeRepoUrl(url: string, providerLabel: string): string {
    if (/^(ssh|git):\/\//i.test(url)) {
        const parsed = new URL(url);
        return `https://${parsed.hostname}${parsed.pathname}`;
    }

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
        return url;
    }

    const withoutCredentials = url.replace(/^[^@/]+@/, '');
    const separatorIndex = withoutCredentials.indexOf(':');
    if (separatorIndex === -1) {
        throw new Error(`Invalid ${providerLabel} repository URL: ${url}`);
    }

    const host = withoutCredentials.slice(0, separatorIndex);
    const path = withoutCredentials.slice(separatorIndex + 1).replace(/^\//, '');
    return `https://${host}/${path}`;
}

export function getRepositoryWebUrl(cloneUrl: string): string {
    return cloneUrl.replace(/\.git$/, '');
}

export function parseRepositoryUrl(
    url: string,
    options: { providerLabel: string; nestedNamespace?: boolean; ignoredSegments?: string[] },
): ParsedRepoUrl {
    const parsed = new URL(normalizeRepoUrl(url, options.providerLabel));
    const ignoredSegments = new Set(options.ignoredSegments ?? []);
    const parts = parsed.pathname
        .replace(/\.git$/, '')
        .split('/')
        .filter(Boolean)
        .filter((segment) => !ignoredSegments.has(segment))
        .map(decodeURIComponent);

    if (parts.length < 2) {
        throw new Error(`Invalid ${options.providerLabel} repository URL: ${url}`);
    }

    const repo = parts[parts.length - 1]!;
    const owner = options.nestedNamespace
        ? parts.slice(0, -1).join('/')
        : parts[parts.length - 2]!;

    return {
        baseUrl: `${parsed.protocol}//${parsed.host}`,
        owner,
        repo,
        projectPath: `${owner}/${repo}`,
    };
}
