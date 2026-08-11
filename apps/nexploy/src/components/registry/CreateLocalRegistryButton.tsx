'use client';

import { Button } from '@workspace/ui/components/button';
import { HardDrive } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateLocalRegistryForm } from '@/components/registry/CreateLocalRegistryForm';
import { useTranslations } from 'next-intl';
import { Can } from '@/components/permission/Can';

export function CreateLocalRegistryButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('admin.registry');

    const handleCreate = () => {
        openDialog({
            title: t('localTitle'),
            description: t('localDescription'),
            content: <CreateLocalRegistryForm />,
        });
    };

    return (
        <Can resource="registry" action="create">
            <Button variant="outline" className={'mt-5'} icon={HardDrive} onClick={handleCreate}>
                {t('localAdd')}
            </Button>
        </Can>
    );
}
