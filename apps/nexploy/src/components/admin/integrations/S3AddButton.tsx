'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { S3AddForm } from '@/components/admin/integrations/S3AddForm';
import { useTranslations } from 'next-intl';

export function S3AddButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.s3');

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <S3AddForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addAccount')}
        </Button>
    );
}
