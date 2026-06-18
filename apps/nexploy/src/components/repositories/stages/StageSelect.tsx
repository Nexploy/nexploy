'use client';

import { useTranslations } from 'next-intl';
import { Layers, Settings2 } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

import { useSelectedStage } from '@/hooks/useSelectedStage';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { usePermissions } from '@/contexts/PermissionContext';
import { StageManager } from './StageManager';

interface StageSelectProps {
    repositoryId: string;
}

export function StageSelect({ repositoryId }: StageSelectProps) {
    const t = useTranslations('repository.stages');
    const { stageId, setStageId, stages } = useSelectedStage(repositoryId);
    const { openDialog } = useConfirmationDialogStore();
    const { can } = usePermissions();

    const openManager = () => {
        openDialog({
            title: t('manageTitle'),
            description: t('manageDescription'),
            content: <StageManager repositoryId={repositoryId} />,
        });
    };

    return (
        <div className="flex items-center gap-1">
            <Layers className="text-muted-foreground size-4" />
            <Select
                value={stageId ?? undefined}
                onValueChange={setStageId}
                disabled={stages.length === 0}
            >
                <SelectTrigger size="sm" className="min-w-[150px]">
                    <SelectValue placeholder={t('selectStage')} />
                </SelectTrigger>
                <SelectContent>
                    {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {can('repository', 'update') && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={openManager}
                        >
                            <Settings2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('manageTitle')}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
