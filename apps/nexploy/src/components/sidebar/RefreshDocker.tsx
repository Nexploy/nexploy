'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { onDockerRefreshAction } from '@/actions/docker/dockerRefresh.action';
import { useTranslations } from 'next-intl';

export function RefreshDocker() {
    const [isLoading, setIsloading] = useState(false);
    const t = useTranslations('docker');

    const onRefreshDocker = async (e: any) => {
        e.preventDefault();

        setIsloading(true);
        await onDockerRefreshAction();
        setIsloading(false);
    };

    return (
        <Tooltip>
            <TooltipTrigger className={'ml-auto'}>
                <RefreshCw
                    onClick={onRefreshDocker}
                    className={cn('size-4 cursor-pointer', isLoading && 'animate-spin')}
                />
            </TooltipTrigger>
            <TooltipContent>
                <p>{t('refreshDocker')}</p>
            </TooltipContent>
        </Tooltip>
    );
}
