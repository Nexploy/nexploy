'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { AddDomainForm } from '@/components/domains/AddDomainForm';

export function AddDomainButton() {
    const t = useTranslations('repository.settings.domains');
    const router = useRouter();
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleAdd = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            props: { className: 'md:max-w-[700px]' },
            content: <AddDomainForm />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    return (
        <Button onClick={handleAdd}>
            <Plus />
            {t('add')}
        </Button>
    );
}
