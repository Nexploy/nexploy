'use client';

import { useRealtime } from 'inngest/react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, GitBranch, GitCommit } from 'lucide-react';
import { Separator } from '@workspace/ui/components/separator';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { BuildLogsViewer } from '@/components/repositories/tabs/builds/logs/BuildLogsViewer';
import { useRouter } from 'next/navigation';
import { getRepositorieBuildLogs } from '@/services/repository.service';
import { useBuildActions } from '@/hooks/useBuildActions';
import { isBuildLive } from '@/utils/buildStatus';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';

interface BuildLogsProps {
    build: NonNullable<Awaited<ReturnType<typeof getRepositorieBuildLogs>>>;
}

export function BuildLogs({ build }: BuildLogsProps) {
    const router = useRouter();

    const { messages } = useRealtime({
        token: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId: build.id,
                topics: ['log', 'commit-info'],
            });
            if (!result?.data) throw new Error('Failed to get subscription token');
            return result.data;
        },
    });

    const data = messages.all as BuildMessage[];
    const latestData = messages.last as BuildMessage | null;

    const liveCommitInfo = data.findLast((e) => e.topic === 'commit-info')?.data;

    const branch = liveCommitInfo?.branch ?? build.branch;
    const commitHash = liveCommitInfo?.commitHash ?? build.commitHash;
    const commitMessage = liveCommitInfo?.commitMessage ?? build.commitMessage;

    const { actions, status } = useBuildActions({
        buildId: build.id,
        initialStatus: build.status,
        onRemoveSuccess: () => router.back(),
    });
    const isLive = isBuildLive(status);

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b p-3">
                <div className="flex gap-4">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={router.back}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex flex-1 flex-col">
                        {isLive && !commitMessage ? (
                            <Skeleton className="h-6 w-64" />
                        ) : (
                            <span className="text-xl font-semibold">
                                {commitMessage ?? `#${build.id}`}
                            </span>
                        )}
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            {isLive && !branch ? (
                                <Skeleton className="h-3 w-20" />
                            ) : (
                                <code className="flex shrink-0 items-center gap-1">
                                    <GitBranch className="size-3" />
                                    {branch}
                                </code>
                            )}
                            {isLive && !commitHash ? (
                                <>
                                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                    <Skeleton className="h-3 w-16" />
                                </>
                            ) : (
                                commitHash && (
                                    <>
                                        <Separator
                                            orientation={'vertical'}
                                            className={'!h-3 w-1'}
                                        />
                                        <code className="flex shrink-0 items-center gap-1">
                                            <GitCommit className="size-3" />
                                            {commitHash.slice(0, 7)}
                                        </code>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {actions.map((action) =>
                            action.type === 'component' ? (
                                <div key={action.id}>{action.component}</div>
                            ) : (
                                <Button
                                    key={action.id}
                                    size={action.label ? 'default' : 'icon'}
                                    variant={
                                        action.variant === 'destructive' ? 'destructive' : 'default'
                                    }
                                    onClick={action.onClick}
                                >
                                    <action.icon className="size-4" />
                                    {action.label}
                                </Button>
                            ),
                        )}
                    </div>
                </div>
            </div>
            <BuildLogsViewer
                inngestData={{ latestData, data }}
                buildId={build.id}
                initialStatus={build.status}
                initialLogs={build.log}
                createdAt={build.createdAt}
            />
        </div>
    );
}
