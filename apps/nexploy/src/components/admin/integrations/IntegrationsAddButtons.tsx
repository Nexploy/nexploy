'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { GitHubAppSetupForm } from '@/components/admin/integrations/GitHubAppSetupForm';
import { GitlabAppSetupForm } from '@/components/admin/integrations/GitlabAppSetupForm';
import { GiteaAppSetupForm } from '@/components/admin/integrations/GiteaAppSetupForm';
import { useTranslations } from 'next-intl';

interface IntegrationsAddButtonsProps {
    provider: 'github' | 'gitlab' | 'gitea';
}

export function IntegrationsAddButtons({ provider }: IntegrationsAddButtonsProps) {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations');
    const tOAuth = useTranslations('integrations.oauth');

    const handleAdd = () => {
        switch (provider) {
            case 'github':
                openDialog({
                    title: tOAuth('configureTitle', { provider: t('github.title') }),
                    description: tOAuth('guide.github.manifestDescription'),
                    content: <GitHubAppSetupForm />,
                });
                break;
            case 'gitlab':
                openDialog({
                    title: tOAuth('configureTitle', { provider: t('gitlab.title') }),
                    description: tOAuth('configureDescription', { provider: t('gitlab.title') }),
                    content: <GitlabAppSetupForm />,
                });
                break;
            case 'gitea':
                openDialog({
                    title: tOAuth('configureTitle', { provider: t('gitea.title') }),
                    description: tOAuth('configureDescription', { provider: t('gitea.title') }),
                    content: <GiteaAppSetupForm />,
                });
                break;
        }
    };

    const ADD_LABELS = {
        github: 'addGithub',
        gitlab: 'addGitlab',
        gitea: 'addGitea',
    } as const;
    const label = tOAuth(ADD_LABELS[provider]);

    const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        handleAdd();
    };

    return (
        <Button icon={Plus} onClick={handleOnClick}>
            {label}
        </Button>
    );
}
