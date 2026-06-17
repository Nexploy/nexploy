'use client';

import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { usePermissions } from '@/contexts/PermissionContext';
import { DeleteRepositoryForm } from '@/components/repositories/DeleteRepositoryForm';

interface DeleteRepositoryButtonProps {
    repositoryId: string;
    repositoryName: string;
}

export function DeleteRepositoryButton({ repositoryId, repositoryName }: DeleteRepositoryButtonProps) {
    const t = useTranslations('repository.settings.dangerZone');
    const { openDialog } = useConfirmationDialogStore();
    const { can } = usePermissions();

    if (!can('repository', 'delete')) return null;

    const handleOpenDelete = () => {
        openDialog({
            title: t('deleteTitle'),
            description: t('deleteDescription'),
            props: { showCloseButton: false },
            closeOnBackground: false,
            content: (
                <DeleteRepositoryForm
                    repositoryId={repositoryId}
                    repositoryName={repositoryName}
                />
            ),
        });
    };

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium">{t('deleteButton')}</p>
                <p className="text-muted-foreground text-xs">{t('deleteButtonDescription')}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleOpenDelete}>
                {t('deleteButton')}
            </Button>
        </div>
    );
}
