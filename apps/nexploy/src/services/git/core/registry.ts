import { GitProviderType } from 'generated/client';
import { GitProviderAdapter } from '@/services/git/core/GitProviderAdapter';
import { githubAdapter } from '@/services/git/providers/github/github.adapter';
import { gitlabAdapter } from '@/services/git/providers/gitlab/gitlab.adapter';
import { giteaAdapter } from '@/services/git/providers/gitea/gitea.adapter';

const gitAdapters: Record<GitProviderType, GitProviderAdapter> = {
    GITHUB: githubAdapter,
    GITLAB: gitlabAdapter,
    GITEA: giteaAdapter,
};

export function getGitAdapter(provider: GitProviderType): GitProviderAdapter {
    const adapter = gitAdapters[provider];
    if (!adapter) {
        throw new Error(`Unsupported git provider: ${provider}`);
    }
    return adapter;
}

export function isSupportedGitProvider(provider: string): provider is GitProviderType {
    return provider in gitAdapters;
}
