import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { RunBuildButton } from '@/components/projects/RunBuildButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ProjectEnvTab } from '@/components/projects/tabs/ProjectEnvTab';
import { GitBranch, Github, Gitlab, Key, LayoutDashboard, Link2 } from 'lucide-react';
import { ProjectBuildsTab } from '@/components/projects/tabs/builds/ProjectBuildsTab';
import { getProjectByIdService } from '@/services/project.service';

interface ProjectIdPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

const getGitIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('github')) return Github;
    if (p.includes('gitlab')) return Gitlab;
    return Link2;
};

export default async function ProjectIdPage({ params }: ProjectIdPageProps) {
    const { projectId } = await params;
    const project = await getProjectByIdService(projectId);
    if (!project) notFound();

    const GitIcon = getGitIcon(project.gitProvider);

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex items-start justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <GitIcon className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {project.name}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                <GitBranch className="size-3" />
                                <span className="font-mono">{project.branch}</span>
                            </p>
                        </div>
                    </div>
                    <RunBuildButton projectId={project.id} />
                </div>

                <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
                    <TabsList className="mx-5 mb-2">
                        <TabsTrigger value="overview">
                            <LayoutDashboard />
                            Builds
                        </TabsTrigger>
                        <TabsTrigger value="env">
                            <Key />
                            Environment
                        </TabsTrigger>
                    </TabsList>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            <TabsContent value="overview" className="mt-0">
                                <ProjectBuildsTab projectId={project.id} builds={project.build} />
                            </TabsContent>
                            <TabsContent value="env" className="mt-0">
                                <ProjectEnvTab
                                    projectId={project.id}
                                    envVariables={project.envVariables}
                                />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            </div>
        </div>
    );
}
