'use client';

import { memo } from 'react';
import dayjs from 'dayjs';
import { buttonVariants } from '@workspace/ui/components/button';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import type { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore';
import { isBuildLive } from '@/utils/buildStatus';
import { StatusView } from '@/components/shared/StatusView';
import { cn } from '@workspace/ui/lib/utils';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { StopBuildToolbar } from '@/components/pipeline/StopBuildToolbar.tsx';

export interface BuildsPanelItemProps {
    build: PipelineBuild;
    isSelected: boolean;
    locale: string;
}

export const BuildsPanelItem = memo(function BuildsPanelItem({
    build,
    isSelected,
    locale,
}: BuildsPanelItemProps) {
    const isLive = isBuildLive(build.status);

    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    return (
        <div
            role="button"
            onClick={() => setActiveBuildId(isSelected ? null : build.id)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveBuildId(isSelected ? null : build.id)}
            className={cn(
                buttonVariants({ variant: isSelected ? 'default' : 'secondary', size: 'sm' }),
                'relative h-auto cursor-pointer flex-col items-start gap-0.5 px-2.5 py-1.5 duration-0',
            )}
        >
            <div className="flex w-full items-center gap-1">
                <StatusView status={build.status} displayType="dot" />
                <span className="text-xs font-medium">#{build.number}</span>
                <span className="text-xs font-medium">{build.branch}</span>
                <span className="ml-auto pl-2 text-xs">
                    {dayjs(build.createdAt).locale(locale).fromNow(true)}
                </span>
            </div>
            {isLive && !build.commitMessage ? (
                <Skeleton className="h-2.5 w-32" />
            ) : (
                build.commitMessage && (
                    <span className={cn('max-w-[220px] truncate text-left text-xs')}>
                        {build.commitMessage}
                    </span>
                )
            )}
            <StopBuildToolbar buildId={build.id} status={build.status} />
        </div>
    );
});
