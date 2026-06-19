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
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore.ts';

interface StageSelectProps {
    repositoryId: string;
}

export function StageSelect({ repositoryId }: StageSelectProps) {
    const t = useTranslations('repository.stages');
    const { stageId, setStageId, stages } = usePipelineStage(repositoryId);
    const { can } = usePermissions();

    const environments = useEnvironmentStore((state) => state.environments);

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
                            {stages.map((stage) => {
                                const environmentName = stage.environmentId
                                    ? (environments.find((env) => env.id === stage.environmentId)
                                          ?.name ?? stage.environmentId)
                                    : t('environmentNotSet');
                                return (
                                    <SelectItem key={stage.id} value={stage.id}>
                                        <div className="flex items-center gap-1">
                                            <span>{stage.name}</span>
                                            <span className={'text-muted-foreground text-xs'}>
                                                ({environmentName})
                                            </span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {can('repository', 'update') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon">
                                <Link href={`/repositories/${repositoryId}/stages`}>
                                    <Settings2 />
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
