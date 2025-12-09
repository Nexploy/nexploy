import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { RepositoryEnvTab } from '@/components/repositories/tabs/envs/RepositoryEnvTab';
import { RepositoryDomainsTab } from '@/components/repositories/tabs/domains/RepositoryDomainsTab';
import { RepositorySettingsTab } from '@/components/repositories/tabs/settings/RepositorySettingsTab';
import { RepositoryVersionsTab } from '@/components/repositories/tabs/versions/RepositoryVersionsTab';
import {
    GitBranch,
    Github,
    Gitlab,
    Globe,
    Hammer,
    Key,
    Link2,
    Rocket,
    Settings,
    Tag,
} from 'lucide-react';
import { RepositoryBuildsTab } from '@/components/repositories/tabs/builds/RepositoryBuildsTab';
import { RepositoryDeploymentTab } from '@/components/repositories/tabs/deployment/RepositoryDeploymentTab';
import { getRepositorieById } from '@/services/repository.service';
import { Separator } from '@workspace/ui/components/separator';
import { capitalizeFirstLetter, capitalizeOnlyFirst } from '@/utils/capitalize';

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
                            <div
                                className={'text-muted-foreground flex items-center gap-2 text-sm'}
                            >
                                <span>{capitalizeFirstLetter(repository.gitProvider)}</span>
                                <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                <p className="flex items-center gap-1">
                                    <GitBranch className="size-3" />
                                    <span>{repository.branch}</span>
                                </p>
                                <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                <span>{capitalizeOnlyFirst(repository.buildType)}</span>
                            </div>
                        </div>
                    </div>
                    <RunBuildButton repositoryId={repository.id} />
                </div>

                <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
                    <div className={'flex justify-between'}>
                        <TabsList className="mx-5 mb-2">
                            <div className={'flex gap-2'}>
                                <TabsTrigger value="overview">
                                    <Hammer />
                                    Builds
                                </TabsTrigger>
                                <TabsTrigger value="versions">
                                    <Tag />
                                    Versions
                                </TabsTrigger>
                                <TabsTrigger value="env">
                                    <Key />
                                    Environments
                                </TabsTrigger>
                                <TabsTrigger value="domain">
                                    <Globe />
                                    Domains
                                </TabsTrigger>
                                <TabsTrigger value="deployment">
                                    <Rocket />
                                    Deployment
                                </TabsTrigger>
                            </div>
                        </TabsList>
                        <TabsList className="mx-5 mb-2">
                            <TabsTrigger value="setting">
                                <Settings />
                                Settings
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            <TabsContent value="overview" className="mt-0">
                                <RepositoryBuildsTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="versions" className="mt-0">
                                <RepositoryVersionsTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="env" className="mt-0">
                                <RepositoryEnvTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="domain" className="mt-0">
                                <RepositoryDomainsTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="deployment" className="mt-0">
                                <RepositoryDeploymentTab repositoryId={repository.id} />
                            </TabsContent>
                            <TabsContent value="setting" className="mt-0">
                                <RepositorySettingsTab repositoryId={repository.id} />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            </div>
        </div>
    );
}
