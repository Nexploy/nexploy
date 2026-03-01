'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { GitHubAppSetupForm } from '@/components/admin/integrations/GitHubAppSetupForm';
import { GitlabAppSetupForm } from '@/components/admin/integrations/GitlabAppSetupForm';
import { useTranslations } from 'next-intl';

interface IntegrationsAddButtonsProps {
    provider: 'github' | 'gitlab';
}

export function IntegrationsAddButtons({ provider }: IntegrationsAddButtonsProps) {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations');
    const tOAuth = useTranslations('integrations.oauth');

    const handleAdd = () => {
        switch (provider) {
            case 'github':
                openDialog({
                    closeOnBackground: true,
                    title: tOAuth('configureTitle', { provider: t('github.title') }),
                    description: tOAuth('guide.github.manifestDescription'),
                    props: { className: 'sm:max-w-lg' },
                    content: <GitHubAppSetupForm />,
                });
                break;
            case 'gitlab':
                openDialog({
                    closeOnBackground: true,
                    title: tOAuth('configureTitle', { provider: t('gitlab.title') }),
                    description: tOAuth('configureDescription', { provider: t('gitlab.title') }),
                    props: { className: 'sm:max-w-[425px]' },
                    content: <GitlabAppSetupForm />,
                });
                break;
        }
    };

    const label = provider === 'github' ? tOAuth('addGithub') : tOAuth('addGitlab');

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
