'use client';

import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import Link from 'next/link';
import { Clock, GitBranch } from 'lucide-react';
import dayjs from 'dayjs';
import { Build } from 'generated/client';
import { Separator } from '@workspace/ui/components/separator';
import { getStatusBadge } from '@/components/utils/StatusBadge';

interface BuildLogsProps {
    repositoryId: string;
    index: number;
    build: Build;
}

export function RepositoryBuild({ repositoryId, build, index }: BuildLogsProps) {
    const { latestData } = useInngestSubscription({
        enabled: build.status !== 'COMPLETED',
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId: build.id,
                topics: ['status'],
            });
            return result?.data ?? null;
        },
    });

    return (
        <Link
            href={`/repositories/${repositoryId}/${build.id}`}
            className="hover:bg-muted/50 flex cursor-pointer flex-col justify-center p-3"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {getStatusBadge(latestData?.data.status ?? build.status)}
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
                            <Separator orientation={'vertical'} className={'!h-4 w-1'} />
                            <span>#{build.commitHash}</span>
                        </>
                    )}
                    <Separator orientation={'vertical'} className={'!h-4 w-1'} />
                    <span className="flex shrink-0 items-center gap-1">
                        <GitBranch className="size-3" />
                        {build.branch}
                    </span>
                </div>
            </div>
        </Link>
    );
}
