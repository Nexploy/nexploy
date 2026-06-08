'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateRegistryForm } from '@/components/admin/registry/CreateRegistryForm';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/PermissionContext';

export function AddRegistryButton() {
    const { can } = usePermissions();
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin.registry');
    if (!can('registry', 'create')) return null;

    const handleAdd = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <CreateRegistryForm />,
        });
    };

    return (
        <Button className={'mt-5'} icon={Plus} onClick={handleAdd}>
            {t('add')}
        </Button>
    );
}
