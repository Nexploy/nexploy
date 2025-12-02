import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { RepositoryEnvTab } from '@/components/repositories/tabs/envs/RepositoryEnvTab';
import { RepositoryDomainsTab } from '@/components/repositories/tabs/domains/RepositoryDomainsTab';
import { GitBranch, Github, Gitlab, Globe, Key, LayoutDashboard, Link2 } from 'lucide-react';
import { RepositoryBuildsTab } from '@/components/repositories/tabs/builds/RepositoryBuildsTab';
import { getRepositorieById } from '@/services/repositorie.service';

interface RepositoryIdPageProps {
    params: Promise<{
        repositoryId: string;
    }>;
}

const getGitIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('github')) return Github;
    if (p.includes('gitlab')) return Gitlab;
    return Link2;
};

export default async function RepositoryIdPage({ params }: RepositoryIdPageProps) {
    const { repositoryId } = await params;
    const repository = await getRepositorieById(repositoryId);
    if (!repository) notFound();

    const GitIcon = getGitIcon(repository.gitProvider);

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
                                {repository.name}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                <GitBranch className="size-3" />
                                <span className="font-mono">{repository.branch}</span>
                            </p>
                        </div>
                    </div>
                    <RunBuildButton repositoryId={repository.id} />
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
                        <TabsTrigger value="domains">
                            <Globe />
                            Domains
                        </TabsTrigger>
                    </TabsList>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            <TabsContent value="overview" className="mt-0">
                                <RepositoryBuildsTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="env" className="mt-0">
                                <RepositoryEnvTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="domains" className="mt-0">
                                <RepositoryDomainsTab repositoryId={repository.id} />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            </div>
        </div>
    );
}
