'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateOrganizationForm } from '@/components/organization/CreateOrganizationForm';
import { useTranslations } from 'next-intl';

export function CreateOrganizationButton() {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('organization');

    const handleCreate = () => {
        openDialog({
            title: t('createOrganization'),
            description: t('createOrganizationDescription'),
            content: <CreateOrganizationForm />,
        });
    };

    return (
        <Button className={'mt-5'} onClick={handleCreate}>
            <Plus />
            {t('createOrganization')}
        </Button>
    );
}
