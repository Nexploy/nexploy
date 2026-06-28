'use client';

import Link from 'next/link';
import { Clock, GitBranch, GitCommit, Square } from 'lucide-react';
import dayjs from 'dayjs';
import type { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore';
import { Separator } from '@workspace/ui/components/separator';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { StatusLive } from '@/components/shared/StatusLive';
import { DurationLive } from '@/components/shared/DurationLive';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { Button } from '@workspace/ui/components/button';
import { useRealtime } from 'inngest/react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type CommitInfo } from '@workspace/typescript-interface/pipeline/pipeline';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';
import { isBuildLive } from '@/utils/buildStatus';
import { BuildDropdownActions } from '@/components/repositories/BuildDropdownActions';
import { useTranslations } from 'next-intl';

interface BuildLogsProps {
    repositoryId: string;
    build: PipelineBuild;
}

export function RepositoryBuild({ repositoryId, build }: BuildLogsProps) {
    const t = useTranslations('repository.builds');
    const isLive = isBuildLive(build.status);
    const [liveCommitInfo, setLiveCommitInfo] = useState<CommitInfo | null>(null);
    const processedCountRef = useRef(0);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId: build.id,
            topics: ['commit-info'],
        });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [build.id]);

    const { messages } = useRealtime({
        enabled: isLive,
        token: refreshToken,
    });
    const liveEvents = messages.all as BuildMessage[];

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
            className="hover:bg-muted/70 bg-card flex cursor-pointer items-center justify-between gap-2 p-3"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <StatusLive key={build.id} buildId={build.id} initialStatus={build.status} />
                    {isLive && !commitMessage ? (
                        <Skeleton className="h-4 w-48" />
                    ) : (
                        <span className="line-clamp-1 text-sm font-medium">
                            #{build.number} {commitMessage ?? `#${build.id}`}
                        </span>
                    )}
                </div>
                <div className={'text-muted-foreground flex items-center gap-2 text-xs'}>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {dayjs(build.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                    <Separator orientation={'vertical'} className={'h-3! w-1'} />
                    <DurationLive
                        buildId={build.id}
                        initialStatus={build.status}
                        createdAt={build.createdAt}
                        updatedAt={build.updatedAt}
                    />
                    {isLive && !commitHash ? (
                        <>
                            <Separator orientation={'vertical'} className={'h-3! w-1'} />
                            <Skeleton className="h-3 w-16" />
                        </>
                    ) : (
                        commitHash && (
                            <>
                                <Separator orientation={'vertical'} className={'h-3! w-1'} />
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="size-3" />
                                    {commitHash}
                                </span>
                            </>
                        )
                    )}
                    {branch && (
                        <>
                            <Separator orientation={'vertical'} className={'h-3! w-1'} />
                            <span className="flex shrink-0 items-center gap-1">
                                <GitBranch className="size-3" />
                                {branch}
                            </span>
                        </>
                    )}
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
