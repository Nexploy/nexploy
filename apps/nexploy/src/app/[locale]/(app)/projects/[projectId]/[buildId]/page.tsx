import { notFound } from 'next/navigation';
import { BuildLogsViewer } from '@/components/projects/BuildLogsViewer';
import { ArrowLeft, GitBranch, GitCommit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { getProjectByIdService } from '@/services/project.service';

interface BuildPageProps {
    params: Promise<{
        projectId: string;
        buildId: string;
    }>;
}

export default async function BuildPage({ params }: BuildPageProps) {
    const { projectId, buildId } = await params;
    const project = await getProjectByIdService(projectId);
    if (!project) notFound();

    const build = project.build.find((d) => d.id === buildId);
    if (!build) notFound();

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="border-b px-5 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/projects/${projectId}`}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{project.name}</h1>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-mono text-sm">#{buildId.slice(-6)}</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                                <GitBranch className="size-3" />
                                {project.branch}
                            </span>
                            {build.commitHash && (
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="size-3" />
                                    {build.commitHash.slice(0, 7)}
                                </span>
                            )}
                            {build.commitMessage && (
                                <span className="max-w-md truncate">{build.commitMessage}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <BuildLogsViewer
                buildId={buildId}
                initialStatus={build.status}
                createdAt={build.createdAt}
            />
        </div>
    );
}
