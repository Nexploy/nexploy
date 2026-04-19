'use client';

import Link from 'next/link';
import { Clock, GitBranch, GitCommit } from 'lucide-react';
import dayjs from 'dayjs';
import { Build } from 'generated/client';
import { Separator } from '@workspace/ui/components/separator';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { StatusLive } from '@/components/shared/StatusLive';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { Button } from '@workspace/ui/components/button';
import { Square } from 'lucide-react';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type CommitInfo } from '@/types/pipeline.type';
import { isBuildLive } from '@/utils/buildStatus';
import { BuildDropdownActions } from '@/components/repositories/BuildDropdownActions';

type BuildWithEnvironment = Build & {
    environment: { id: string; name: string } | null;
};

interface BuildLogsProps {
    repositoryId: string;
    index: number;
    build: BuildWithEnvironment;
}

export function RepositoryBuild({ repositoryId, build, index }: BuildLogsProps) {
    const isLive = isBuildLive(build.status);
    const [liveCommitInfo, setLiveCommitInfo] = useState<CommitInfo | null>(null);
    const processedCountRef = useRef(0);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId: build.id,
            topics: ['commit-info'],
        });
        return result?.data ?? null;
    }, [build.id]);

    const { data: liveEvents } = useInngestSubscription({
        enabled: isLive,
        refreshToken,
    });

    useEffect(() => {
        const newEvents = liveEvents.slice(processedCountRef.current);
        processedCountRef.current = liveEvents.length;
        for (const event of newEvents) {
            if (event.topic === 'commit-info' && event.data) {
                setLiveCommitInfo(event.data as CommitInfo);
            }
        }
    }, [liveEvents]);

    const branch = liveCommitInfo?.branch ?? build.branch;
    const commitHash = liveCommitInfo?.commitHash ?? build.commitHash;
    const commitMessage = liveCommitInfo?.commitMessage ?? build.commitMessage;

    return (
        <Link
            href={`/repositories/${repositoryId}/${build.id}`}
            className="hover:bg-muted/50 flex cursor-pointer items-center justify-between gap-2 p-3"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <StatusLive key={build.id} buildId={build.id} initialStatus={build.status} />
                    {isLive && !commitMessage ? (
                        <Skeleton className="h-4 w-48" />
                    ) : (
                        <span className="line-clamp-1 text-sm font-medium">
                            #{index} {commitMessage ?? `#${build.id}`}
                        </span>
                    )}
                </div>
                <div className={'text-muted-foreground flex items-center gap-2 text-xs'}>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {dayjs(build.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                    {isLive && !commitHash ? (
                        <>
                            <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                            <Skeleton className="h-3 w-16" />
                        </>
                    ) : (
                        commitHash && (
                            <>
                                <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="size-3" />
                                    {commitHash}
                                </span>
                            </>
                        )
                    )}
                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                    <span className="flex shrink-0 items-center gap-1">
                        <GitBranch className="size-3" />
                        {branch}
                    </span>
                </div>
            </div>
            {isBuildLive(build.status) ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCancelBuild({ buildId: build.id });
                    }}
                >
                    <Square className="size-4" />
                </Button>
            ) : (
                <BuildDropdownActions buildId={build.id} status={build.status} />
            )}
        </Link>
    );
}
