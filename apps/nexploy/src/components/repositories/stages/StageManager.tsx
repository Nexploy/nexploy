'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { useStages } from '@/hooks/useStages';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteStageAction } from '@/actions/repository/stages/deleteStage.action';
import { StageForm } from './StageForm';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

interface StageManagerProps {
    repositoryId: string;
}

export function StageManager({ repositoryId }: StageManagerProps) {
    const t = useTranslations('repository.stages');
    const { stages, mutate } = useStages(repositoryId);
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const [editing, setEditing] = useState<DeploymentStage | null>(null);

    const handleDelete = (stage: DeploymentStage) => {
        openAlertDialog({
            title: t('removeTitle', { name: stage.name }),
            description: t('removeDescription'),
            cancelLabel: t('cancelEdit'),
            actionLabel: t('remove'),
            onAction: async () => {
                const result = await deleteStageAction({ id: stage.id });
                if (result?.serverError) return;
                if (editing?.id === stage.id) setEditing(null);
                await mutate();
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                {stages.map((stage) => (
                    <div
                        key={stage.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {stage.name}
                                {stage.isProduction && (
                                    <span className="text-muted-foreground ml-2 text-xs">
                                        {t('productionBadge')}
                                    </span>
                                )}
                            </span>
                            <span className="text-muted-foreground text-xs">{stage.slug}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => setEditing(stage)}
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-destructive size-7"
                                disabled={stages.length <= 1}
                                onClick={() => handleDelete(stage)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
                <span className="text-sm font-medium">
                    {editing ? t('editStage') : t('newStage')}
                </span>
                <StageForm
                    key={editing?.id ?? 'new'}
                    repositoryId={repositoryId}
                    stage={editing ?? undefined}
                    onSaved={() => {
                        setEditing(null);
                        mutate();
                    }}
                    onCancelEdit={() => setEditing(null)}
                />
            </div>
        </div>
    );
}
