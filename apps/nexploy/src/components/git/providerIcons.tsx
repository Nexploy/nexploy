import Github from '@thesvg/react/github';
import Gitlab from '@thesvg/react/gitlab';
import { GitProviderType } from 'generated/client';

export const PROVIDER_ICONS: Record<GitProviderType, React.ElementType> = {
    GITHUB: Github,
    GITLAB: Gitlab,
};
