'use client';

import { MouseEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, RotateCw, Square } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { Separator } from '@workspace/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { onComposesAction } from '@/actions/docker/composes/composeAction';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { StackDropdownActions } from '@/components/docker/containers/StackDropdownActions';

interface StackActionsCellProps {
    stackName: string;
    runningCount: number;
    totalCount: number;
}

export function StackActionsCell({ stackName, runningCount, totalCount }: StackActionsCellProps) {
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('common');
    const hasRunning = runningCount > 0;
    const allRunning = runningCount === totalCount;

    const handleAction = async (action: ComposesAction, event: MouseEvent) => {
        event.stopPropagation();
        setIsLoading(true);
        await onComposesAction({ stackName, action });
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <ProtectedAction action="container.lifecycle">
                        <Button
                            onClick={(e) => handleAction('start', e)}
                            disabled={isLoading || allRunning}
                            isLoading={isLoading}
                            variant="outline"
                            icon={Play}
                            size="icon"
                            className="size-7"
                        >
                            <span className="sr-only">{t('start')}</span>
                        </Button>
                    </ProtectedAction>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('start')}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <ProtectedAction action="container.lifecycle">
                        <Button
                            onClick={(e) => handleAction('stop', e)}
                            disabled={isLoading || !hasRunning}
                            isLoading={isLoading}
                            variant="outline"
                            icon={Square}
                            size="icon"
                            className="size-7"
                        >
                            <span className="sr-only">{t('stop')}</span>
                        </Button>
                    </ProtectedAction>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('stop')}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <ProtectedAction action="container.lifecycle">
                        <Button
                            onClick={(e) => handleAction('restart', e)}
                            disabled={isLoading || !hasRunning}
                            isLoading={isLoading}
                            variant="outline"
                            icon={RotateCw}
                            size="icon"
                            className="size-7"
                        >
                            <span className="sr-only">{t('restart')}</span>
                        </Button>
                    </ProtectedAction>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('restart')}</p>
                </TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 h-5!" />
            <StackDropdownActions stackName={stackName} containerCount={totalCount} triggerClassName="size-7" />
        </div>
    );
}
