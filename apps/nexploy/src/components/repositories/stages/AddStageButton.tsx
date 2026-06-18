'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { usePermissions } from '@/contexts/PermissionContext';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { StageForm } from '@/components/repositories/stages/StageForm';

interface AddStageButtonProps {
    repositoryId: string;
}

export function AddStageButton({ repositoryId }: AddStageButtonProps) {
    const { can } = usePermissions();
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const { mutate } = usePipelineStage(repositoryId);
    const t = useTranslations('repository.stages');

    if (!can('repository', 'update')) return null;

    const handleAdd = () => {
        openDialog({
            title: t('newStage'),
            description: t('addNewStageDescription'),
            content: <StageForm repositoryId={repositoryId} />,
            onSuccess: () => {
                closeDialog();
                mutate();
            },
        });
    };

    return (
        <Button icon={Plus} onClick={handleAdd}>
            {t('addStage')}
        </Button>
    );
}
