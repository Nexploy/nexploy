'use client';

import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, GitBranch, GitCommit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Separator } from '@workspace/ui/components/separator';
import { BuildLogsViewer } from '@/components/repositories/tabs/builds/logs/BuildLogsViewer';
import { useRouter } from 'next/navigation';
import { getRepositorieBuildLogs } from '@/services/repository.service';
import { useBuildActions } from '@/hooks/useBuildActions';

interface BuildLogsProps {
    build: NonNullable<Awaited<ReturnType<typeof getRepositorieBuildLogs>>>;
}

export function BuildLogs({ build }: BuildLogsProps) {
    const router = useRouter();

    const { latestData, data } = useInngestSubscription({
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId: build.id,
                topics: ['status', 'log'],
            });
            return result?.data ?? null;
        },
    });

    const status = latestData?.data.status ?? build.status;
    const actions = useBuildActions({
        buildId: build.id,
        status,
        onRemoveSuccess: () => router.back(),
    });

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b p-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={router.back}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex flex-1 flex-col">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="line-clamp-1 text-xl font-semibold">
                                    {build.commitMessage}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className={'max-w-md break-all'}>
                                {build.commitMessage}
                            </TooltipContent>
                        </Tooltip>

                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <code className="flex shrink-0 items-center gap-1">
                                <GitBranch className="size-3" />
                                {build.branch}
                            </code>
                            {build.commitHash && (
                                <>
                                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                    <code className="flex shrink-0 items-center gap-1">
                                        <GitCommit className="size-3" />
                                        {build.commitHash.slice(0, 7)}
                                    </code>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
