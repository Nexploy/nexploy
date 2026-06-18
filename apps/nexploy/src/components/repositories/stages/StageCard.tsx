'use client';

import useSWR from 'swr';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { deleteStageAction } from '@/actions/repository/stages/deleteStage.action';
import { StageForm } from '@/components/repositories/stages/StageForm';
import { Can } from '@/components/permission/Can';
import type { DeploymentStage } from '@workspace/typescript-interface/repository/deploymentStage';

interface EnvironmentOption {
    id: string;
    name: string;
}

interface StageCardProps {
    stage: DeploymentStage;
    repositoryId: string;
}

export function StageCard({ stage, repositoryId }: StageCardProps) {
    const t = useTranslations('repository.stages');
    const tCommon = useTranslations('common');
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const { mutate } = usePipelineStage(repositoryId);

    const { data: environments } = useSWR<EnvironmentOption[]>(
        { url: '/api/environments' },
        fetcherApi,
    );

    const environmentName = stage.environmentId
        ? (environments?.find((env) => env.id === stage.environmentId)?.name ?? stage.environmentId)
        : t('environmentNotSet');

    const handleEdit = () => {
        openDialog({
            title: t('editStage'),
            description: t('editDescription'),
            content: <StageForm repositoryId={repositoryId} stage={stage} />,
            onSuccess: () => {
                closeDialog();
                mutate();
            },
        });
    };

    const handleDelete = () => {
        openAlertDialog({
            title: t('removeTitle', { name: stage.name }),
            description: t('removeDescription'),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('remove'),
            onAction: async () => {
                const result = await deleteStageAction({ id: stage.id });
                if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                }
                toast.success(t('deleteSuccess'));
                await mutate();
            },
        });
    };

    return (
        <div className="bg-card rounded-lg border">
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.name}</span>
                        {stage.isProduction && <Badge>{t('productionBadge')}</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm">{environmentName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Can resource="repository" action="update">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleEdit}
                            icon={Pencil}
                            title={t('editStage')}
                        />
                    </Can>
                    <Can resource="repository" action="update">
                        {stage.isProduction ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button
                                            variant="destructiveOutline"
                                            size="icon"
                                            icon={Trash2}
                                            title={t('remove')}
                                            disabled
                                        />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>{t('cannotDeleteProduction')}</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Button
                                variant="destructiveOutline"
                                size="icon"
                                onClick={handleDelete}
                                icon={Trash2}
                                title={t('remove')}
                            />
                        )}
                    </Can>
                </div>
            </div>
        </div>
    );
}
