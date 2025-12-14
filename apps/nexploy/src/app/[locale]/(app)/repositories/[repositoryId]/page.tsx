import { notFound } from 'next/navigation';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { RepositoryTabs } from '@/components/repositories/RepositoryTabs';
import { RepositoryEnvTab } from '@/components/repositories/tabs/envs/RepositoryEnvTab';
import { RepositoryDomainsTab } from '@/components/repositories/tabs/domains/RepositoryDomainsTab';
import { RepositorySettingsTab } from '@/components/repositories/tabs/settings/RepositorySettingsTab';
import { RepositoryVersionsTab } from '@/components/repositories/tabs/versions/RepositoryVersionsTab';
import { GitBranch, Github, Gitlab, Link2 } from 'lucide-react';
import { RepositoryBuildsTab } from '@/components/repositories/tabs/builds/RepositoryBuildsTab';
import { RepositoryDeploymentTab } from '@/components/repositories/tabs/deployment/RepositoryDeploymentTab';
import { getRepositorieById } from '@/services/repository.service';
import { Separator } from '@workspace/ui/components/separator';
import { capitalizeFirstLetter, toDisplayLabel } from '@/utils/capitalize';

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
                                <span>{toDisplayLabel(repository.buildType)}</span>
                            </div>
                        </div>
                    </div>
                    <RunBuildButton repositoryId={repository.id} />
                </div>

                <RepositoryTabs>
                    {{
                        overview: <RepositoryBuildsTab repositoryId={repository.id} />,
                        versions: <RepositoryVersionsTab repositoryId={repository.id} />,
                        env: <RepositoryEnvTab repositoryId={repository.id} />,
                        domain: <RepositoryDomainsTab repositoryId={repository.id} />,
                        deployment: <RepositoryDeploymentTab repositoryId={repository.id} />,
                        setting: <RepositorySettingsTab repositoryId={repository.id} />,
                    }}
                </RepositoryTabs>
            </div>
        </div>
    );
}
