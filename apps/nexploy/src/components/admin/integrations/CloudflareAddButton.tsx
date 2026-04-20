'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CloudflareConnectForm } from '@/components/admin/integrations/CloudflareConnectForm';
import { useTranslations } from 'next-intl';

export function CloudflareAddButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.cloudflare');

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        openDialog({
            closeOnBackground: true,
            title: t('addTitle'),
            description: t('addDescription'),
            props: { className: 'sm:max-w-[425px]' },
            content: <CloudflareConnectForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addAccount')}
        </Button>
    );
}
