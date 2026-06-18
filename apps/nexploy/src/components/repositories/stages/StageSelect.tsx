'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Settings2 } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { usePermissions } from '@/contexts/PermissionContext';
import { ButtonGroup } from '@workspace/ui/components/button-group.tsx';

interface StageSelectProps {
    repositoryId: string;
}

export function StageSelect({ repositoryId }: StageSelectProps) {
    const t = useTranslations('repository.stages');
    const { stageId, setStageId, stages } = usePipelineStage(repositoryId);
    const { can } = usePermissions();

    return (
        <div className="flex items-center gap-1">
            <ButtonGroup>
                <Select
                    value={stageId ?? ''}
                    onValueChange={setStageId}
                    disabled={stages.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectStage')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{t('stages')}</SelectLabel>
                            {stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {can('repository', 'update') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon">
                                <Link href={`/repositories/${repositoryId}/stages`}>
                                    <Settings2 className="size-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('manageTitle')}</TooltipContent>
                    </Tooltip>
                )}
            </ButtonGroup>
        </div>
    );
}
