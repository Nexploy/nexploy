'use client';

import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import Link from 'next/link';
import { Clock, GitBranch, GitCommit } from 'lucide-react';
import dayjs from 'dayjs';
import { Build } from 'generated/client';
import { Separator } from '@workspace/ui/components/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BuildDropdownActions } from '@/components/repositories/BuildDropdownActions';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';

type BuildWithEnvironment = Build & {
    environment: { id: string; name: string } | null;
};

interface BuildLogsProps {
    repositoryId: string;
    index: number;
    build: BuildWithEnvironment;
}

const statusEnable: BuildStatus[] = ['COMPLETED', 'FAILED'];

export function RepositoryBuild({ repositoryId, build, index }: BuildLogsProps) {
    const { latestData } = useInngestSubscription({
        enabled: !statusEnable.includes(build.status),
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId: build.id,
                topics: ['status'],
            });
            return result?.data ?? null;
        },
    });

    const status: BuildStatus = latestData?.data.status ?? build.status;

    return (
        <Link
            href={`/repositories/${repositoryId}/${build.id}`}
            className="hover:bg-muted/50 flex cursor-pointer items-center justify-between gap-2 p-3"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="line-clamp-1 text-sm font-medium">
                        #{index} {build.commitMessage ?? `#${build.id}`}
                    </span>
                </div>
                <div className={'text-muted-foreground flex items-center gap-2 text-xs'}>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {dayjs(build.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                    {build.commitHash && (
                        <>
                            <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                            <span className="flex items-center gap-1 font-mono">
                                <GitCommit className="size-3" />
                                {build.commitHash}
                            </span>
                        </>
                    )}
                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                    <span className="flex shrink-0 items-center gap-1">
                        <GitBranch className="size-3" />
                        {build.branch}
                    </span>
                </div>
            </div>
            <BuildDropdownActions buildId={build.id} status={status} />
        </Link>
    );
}
