import { notFound } from 'next/navigation';
import { BuildLogsViewer } from '@/components/projects/BuildLogsViewer';
import { ArrowLeft, GitBranch, GitCommit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { getProjectBuildLogs } from '@/services/project.service';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Separator } from '@workspace/ui/components/separator';
import { RetryBuildButton } from '@/components/projects/RetryBuildButton';
import { StopBuildButton } from '@/components/projects/StopBuildButton';

interface BuildPageProps {
    params: Promise<{
        projectId: string;
        buildId: string;
    }>;
}

export default async function BuildPage({ params }: BuildPageProps) {
    const { projectId, buildId } = await params;
    const build = await getProjectBuildLogs(projectId, buildId);

    if (!build) notFound();

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b p-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href={`/projects/${projectId}`}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-1 flex-col">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="line-clamp-1 text-xl font-semibold">
                                    {build.commitMessage}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className={'max-w-md whitespace-break-spaces'}>
                                {build.commitMessage}
                            </TooltipContent>
                        </Tooltip>

                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <code className="flex shrink-0 items-center gap-1">
                                <GitBranch className="size-3" />
                                {build.branch}
                            </code>
                            <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                            {build.commitHash && (
                                <code className="flex shrink-0 items-center gap-1">
                                    <GitCommit className="size-3" />
                                    {build.commitHash.slice(0, 7)}
                                </code>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(build.status === 'QUEUED' || build.status === 'BUILDING') && (
                            <StopBuildButton buildId={buildId} />
                        )}
                        {build.status === 'FAILED' ||
                            (build.status === 'CANCELLED' && (
                                <RetryBuildButton buildId={buildId} projectId={projectId} />
                            ))}
                    </div>
                </div>
            </div>
            <BuildLogsViewer
                buildId={buildId}
                initialStatus={build.status}
                initialLogs={build.log}
                createdAt={build.createdAt}
            />
        </div>
    );
}
