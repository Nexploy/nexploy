import Github from '@thesvg/react/github';
import Gitlab from '@thesvg/react/gitlab';
import Gitea from '@thesvg/react/gitea';
import Bitbucket from '@thesvg/react/bitbucket';
import { AzureReposIcon } from '@/components/git/AzureReposIcon';
import { GitProviderType } from 'generated/client';

export const PROVIDER_ICONS: Record<GitProviderType, React.ElementType> = {
    GITHUB: Github,
    GITLAB: Gitlab,
    GITEA: Gitea,
    BITBUCKET: Bitbucket,
    AZURE_REPOS: AzureReposIcon,
};
