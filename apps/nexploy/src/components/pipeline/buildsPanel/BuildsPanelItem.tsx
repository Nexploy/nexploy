'use client';

import dayjs from 'dayjs';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { BuildStatus } from 'generated/client';
import { Separator } from '@workspace/ui/components/separator';
import { Status, StatusIndicator, StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { type getActiveBuilds } from '@/services/repository.service';
import { useCallback, useEffect, useRef } from 'react';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { type NodeRunStatus } from '@/types/pipeline.type';

const TERMINAL_STATUSES: BuildStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

export const STATUS_PIPELINE: Partial<Record<BuildStatus, StatusProps['status']>> = {
    QUEUED: 'degraded',
    BUILDING: 'maintenance',
    COMPLETED: 'online',
    FAILED: 'offline',
    CANCELLED: 'offline',
};

type ActiveBuild = Awaited<ReturnType<typeof getActiveBuilds>>[number];

export interface BuildsPanelItemProps {
    build: ActiveBuild;
    index: number;
    total: number;
    isSelected: boolean;
    locale: string;
    onSelect: (id: string | undefined) => void;
}

export function BuildsPanelItem({
    build,
    index,
    total,
    isSelected,
    locale,
    onSelect,
}: BuildsPanelItemProps) {
    const isLive = !TERMINAL_STATUSES.includes(build.status);
    const setNodeStatuses = usePipelineEditorStore((s) => s.setNodeStatuses);
    const processedCountRef = useRef(0);
    const prevIsSelectedRef = useRef(isSelected);

    const snapshotNodes = build.pipelineSnapshot
        ? graphToFlow(build.pipelineSnapshot as unknown as PipelineGraph).nodes
        : null;
    const snapshotNodesRef = useRef(snapshotNodes);
    snapshotNodesRef.current = snapshotNodes;

    const refreshStatusToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId: build.id,
            topics: ['status'],
        });
        return result?.data ?? null;
    }, [build.id]);

    const { latestData } = useInngestSubscription({
        enabled: isLive,
        refreshToken: refreshStatusToken,
    });

    const refreshNodeToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId: build.id,
            topics: ['node-status', 'status'],
        });
        return result?.data ?? null;
    }, [build.id]);

    const { data: liveEvents } = useInngestSubscription({
        enabled: isLive && isSelected,
        refreshToken: refreshNodeToken,
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
        for (const evt of newEvents) {
            if (evt.topic === 'node-status' && evt.data?.nodeId) {
                updates[evt.data.nodeId as string] = evt.data.status as NodeRunStatus;
            }
            if (evt.topic === 'status' && evt.data?.status === 'COMPLETED') {
                for (const node of snapshotNodesRef.current ?? []) {
                    if (!updates[node.id]) updates[node.id] = 'completed';
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            setNodeStatuses((prev) => {
                const next = { ...prev, ...updates };
                for (const [id, status] of Object.entries(updates)) {
                    if (status === 'completed' && prev[id] && prev[id] !== 'running') {
                        next[id] = prev[id];
                    }
                }
                return next;
            });
        }
    }, [liveEvents, isSelected]);

    const status: BuildStatus = (latestData?.data?.status ?? build.status) as BuildStatus;

    return (
        <Button
            variant={isSelected ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onSelect(isSelected ? undefined : build.id)}
            className="h-auto flex-col items-start gap-0.5 px-2.5 py-1.5"
        >
            <div className="flex w-full items-center gap-1">
                <Status
                    className={'rounded-none border-0 p-1'}
                    status={STATUS_PIPELINE[status] ?? 'offline'}
                    variant="outline"
                >
                    <StatusIndicator />
                </Status>
                <span className="text-xs font-medium">#{total - index}</span>
                <span className="text-xs font-medium">{build.branch}</span>
                <Separator orientation={'vertical'} className="!h-3" />
                {build.commitHash && <span className="font-mono text-xs">{build.commitHash}</span>}
                <span className="ml-auto pl-2 text-xs">
                    {dayjs(build.createdAt).locale(locale).fromNow(true)}
                </span>
            </div>
            {build.commitMessage && (
                <span className={cn('max-w-[200px] truncate text-left text-xs')}>
                    {build.commitMessage}
                </span>
            )}
        </Button>
    );
}
