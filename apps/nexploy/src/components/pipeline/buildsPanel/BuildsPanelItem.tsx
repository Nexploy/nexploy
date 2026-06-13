'use client';

import dayjs from 'dayjs';
import { buttonVariants } from '@workspace/ui/components/button';
import { StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useCallback, useEffect, useRef } from 'react';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { type CommitInfo, type NodeRunStatus } from '@/types/pipeline.type';
import { BuildStatus } from 'generated/client';
import type { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore';
import { isBuildLive } from '@/utils/buildStatus';
import { StatusLive } from '@/components/shared/StatusLive';
import { cn } from '@workspace/ui/lib/utils';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { StopBuildToolbar } from '@/components/pipeline/StopBuildToolbar.tsx';

export const STATUS_PIPELINE: Record<BuildStatus, StatusProps['status']> = {
    QUEUED: 'waiting',
    BUILDING: 'degraded',
    COMPLETED: 'maintenance',
    FAILED: 'offline',
    CANCELLED: 'offline',
};

export interface BuildsPanelItemProps {
    build: PipelineBuild;
    isSelected: boolean;
    locale: string;
}

export function BuildsPanelItem({ build, isSelected, locale }: BuildsPanelItemProps) {
    const isLive = isBuildLive(build.status);

    const setNodeStatuses = usePipelineEditorStore((s) => s.setNodeStatuses);
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const processedCountRef = useRef(0);
    const prevIsSelectedRef = useRef(isSelected);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId: build.id,
            topics: ['node-status', 'commit-info'],
        });
        return result?.data ?? null;
    }, [build.id]);

    const { data: liveEvents } = useInngestSubscription({
        enabled: isLive,
        refreshToken,
    });

    useEffect(() => {
        const justSelected = isSelected && !prevIsSelectedRef.current;
        prevIsSelectedRef.current = isSelected;

        if (justSelected) {
            processedCountRef.current = liveEvents.length;
            return;
        }

        if (!isSelected) return;

        const newEvents = liveEvents.slice(processedCountRef.current);
        processedCountRef.current = liveEvents.length;
        if (newEvents.length === 0) return;

        const updates: Record<string, NodeRunStatus> = {};
        for (const event of newEvents) {
            if (event.topic === 'node-status' && event.data?.nodeId) {
                updates[event.data.nodeId as string] = event.data.nodeStatus as NodeRunStatus;
            }
        }
        if (Object.keys(updates).length > 0) {
            setNodeStatuses((prev) => ({ ...prev, ...updates }));
        }
    }, [liveEvents, isSelected]);

    const liveCommitInfo = liveEvents.findLast((e) => e.topic === 'commit-info')?.data as
        | CommitInfo
        | undefined;

    const branch = liveCommitInfo?.branch ?? build.branch;
    const commitMessage = liveCommitInfo?.commitMessage ?? build.commitMessage;

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
                <StatusLive
                    key={build.id}
                    displayType={'dot'}
                    buildId={build.id}
                    initialStatus={build.status}
                />
                <span className="text-xs font-medium">#{build.number}</span>
                <span className="text-xs font-medium">{branch}</span>
                <span className="ml-auto pl-2 text-xs">
                    {dayjs(build.createdAt).locale(locale).fromNow(true)}
                </span>
            </div>
            {isLive && !commitMessage ? (
                <Skeleton className="h-2.5 w-32" />
            ) : (
                commitMessage && (
                    <span className={cn('max-w-[220px] truncate text-left text-xs')}>
                        {commitMessage}
                    </span>
                )
            )}
            <StopBuildToolbar buildId={build.id} initialStatus={build.status} />
        </div>
    );
}
