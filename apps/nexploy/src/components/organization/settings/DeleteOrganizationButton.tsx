'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteOrganizationAction } from '@/actions/organization/deleteOrganization.action';

interface DeleteOrganizationButtonProps {
    organizationId: string;
    organizationName: string;
}

export function DeleteOrganizationButton({
    organizationId,
    organizationName,
}: DeleteOrganizationButtonProps) {
    const t = useTranslations('organization');
    const tCommon = useTranslations('common');
    const { openAlertDialog } = useAlertConfirmationDialogStore();

    const { execute, isPending } = useAction(deleteOrganizationAction, {
        onError: ({ error }) => toast.error(error.serverError || t('errors.deleteFailed')),
    });

    const handleDelete = () => {
        openAlertDialog({
            title: t('settings.deleteOrganization'),
            description: t('settings.confirmDelete', { name: organizationName }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('settings.deleteOrganization'),
            onAction: async () => execute({ organizationId }),
        });
    };

    return (
        <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            <Trash2 />
            {t('settings.deleteOrganization')}
        </Button>
    );
}
