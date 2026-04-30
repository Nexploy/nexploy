'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateRegistryForm } from '@/components/admin/registry/CreateRegistryForm';
import { useTranslations } from 'next-intl';

export function AddRegistryButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin.registry');

    const handleAdd = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <CreateRegistryForm />,
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('add')}
        </Button>
    );
}
