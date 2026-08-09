'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { DnsConnectForm } from '@/components/admin/integrations/DnsConnectForm';
import { useTranslations } from 'next-intl';

export function DnsAddButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.dns');

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            props: { className: 'sm:max-w-[425px]' },
            content: <DnsConnectForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addAccount')}
        </Button>
    );
}
