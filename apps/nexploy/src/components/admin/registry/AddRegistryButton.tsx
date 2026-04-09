'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateRegistryForm } from '@/components/admin/registry/CreateRegistryForm';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function AddRegistryButton() {
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin.registry');

    const handleAdd = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <CreateRegistryForm />,
            onSuccess: () => {
                toast.success(t('createSuccess'));
                closeDialog();
            },
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('add')}
        </Button>
    );
}
