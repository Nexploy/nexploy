'use client';

import dayjs from 'dayjs';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { type CommitInfo, type NodeRunStatus } from '@/types/pipeline.type';
import { Build, BuildStatus } from 'generated/client';
import { isBuildLive } from '@/utils/buildStatus';
import { StatusLive } from '@/components/shared/StatusLive';
import { cn } from '@workspace/ui/lib/utils';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Square } from 'lucide-react';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';

export const STATUS_PIPELINE: Record<BuildStatus, StatusProps['status']> = {
    QUEUED: 'waiting',
    BUILDING: 'degraded',
    COMPLETED: 'maintenance',
    FAILED: 'offline',
    CANCELLED: 'offline',
};

export interface BuildsPanelItemProps {
    build: Build;
    isSelected: boolean;
    locale: string;
    onSelect: (id: string | null) => void;
}

export function BuildsPanelItem({ build, isSelected, locale, onSelect }: BuildsPanelItemProps) {
    const isLive = isBuildLive(build.status);
    const setNodeStatuses = usePipelineEditorStore((s) => s.setNodeStatuses);
    const processedCountRef = useRef(0);
    const prevIsSelectedRef = useRef(isSelected);
    const [isCancelling, setIsCancelling] = useState(false);

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
    const commitHash = liveCommitInfo?.commitHash ?? build.commitHash;
    const commitMessage = liveCommitInfo?.commitMessage ?? build.commitMessage;

    const handleCancel = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCancelling(true);
        try {
            await onCancelBuild({ buildId: build.id });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(isSelected ? null : build.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(isSelected ? null : build.id)}
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
                <Separator orientation={'vertical'} className="!h-3" />
                {isLive && !commitHash ? (
                    <Skeleton className="h-3 w-14" />
                ) : (
                    commitHash && <span className="font-mono text-xs">{commitHash}</span>
                )}
                <span className="ml-auto pl-2 text-xs">
                    {dayjs(build.createdAt).locale(locale).fromNow(true)}
                </span>
            </div>
            {isLive && !commitMessage ? (
                <Skeleton className="h-2.5 w-32" />
            ) : (
                commitMessage && (
                    <span className={cn('max-w-[200px] truncate text-left text-xs')}>
                        {commitMessage}
                    </span>
                )
            )}
            {isLive && (
                <Button
                    variant="destructiveGhost"
                    size="icon"
                    disabled={isCancelling}
                    onClick={handleCancel}
                    className="absolute right-0.5 bottom-0.5 h-5 w-5 rounded-sm"
                >
                    <Square />
                </Button>
            )}
        </div>
    );
}
