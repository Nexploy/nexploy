'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { AwsAddForm } from '@/components/admin/integrations/AwsAddForm';
import { useTranslations } from 'next-intl';

export function AwsAddButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.aws');

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <AwsAddForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addAccount')}
        </Button>
    );
}
