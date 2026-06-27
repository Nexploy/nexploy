'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { BucketStorageAddForm } from '@/components/admin/integrations/BucketStorageAddForm';
import { useTranslations } from 'next-intl';

export function BucketStorageAddButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('integrations.bucketStorage');

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <BucketStorageAddForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addAccount')}
        </Button>
    );
}
