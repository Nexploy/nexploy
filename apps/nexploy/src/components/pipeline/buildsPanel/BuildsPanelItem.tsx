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
    const { latestData } = useInngestSubscription({
        enabled: !TERMINAL_STATUSES.includes(build.status),
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId: build.id,
                topics: ['status'],
            });
            return result?.data ?? null;
        },
    });

    const status =
        (latestData?.data?.status as BuildStatus | undefined) ?? (build.status as BuildStatus);

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
