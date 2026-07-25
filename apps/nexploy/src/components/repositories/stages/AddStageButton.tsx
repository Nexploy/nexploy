'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Can } from '@/components/permission/Can';
import { StageForm } from '@/components/repositories/stages/StageForm';

interface AddStageButtonProps {
    repositoryId: string;
}

export function AddStageButton({ repositoryId }: AddStageButtonProps) {
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const router = useRouter();
    const t = useTranslations('repository.stages');


    const handleAdd = () => {
        openDialog({
            title: t('newStage'),
            description: t('addNewStageDescription'),
            content: <StageForm repositoryId={repositoryId} />,
            onSuccess: () => {
                closeDialog();
                router.refresh();
            },
        });
    };

    return (
        <Can resource="repository" action="update">
            <Button icon={Plus} onClick={handleAdd}>
                {t('addStage')}
            </Button>
        </Can>
    );
}
