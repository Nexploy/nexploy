'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateServiceForm } from './CreateServiceForm';
import { useTranslations } from 'next-intl';

export function CreateServiceDialog() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('swarm');

    const handleOpen = () => {
        openDialog({
            title: t('createService'),
            description: t('createServiceDescription'),
            content: <CreateServiceForm />,
        });
    };

    return (
        <Button onClick={handleOpen}>
            <Plus />
            {t('createService')}
        </Button>
    );
}
