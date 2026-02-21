import { notFound } from 'next/navigation';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { RepositoryTabs } from '@/components/repositories/RepositoryTabs';
import { RepositoryEnvTab } from '@/components/repositories/tabs/envs/RepositoryEnvTab';
import { RepositoryDomainsTab } from '@/components/repositories/tabs/domains/RepositoryDomainsTab';
import { RepositorySettingsTab } from '@/components/repositories/tabs/settings/RepositorySettingsTab';
import { RepositoryVersionsTab } from '@/components/repositories/tabs/versions/RepositoryVersionsTab';
import { ExternalLink, GitBranch, Github, Gitlab, Link2, Server } from 'lucide-react';
import { RepositoryBuildsTab } from '@/components/repositories/tabs/builds/RepositoryBuildsTab';
import { RepositoryDeploymentTab } from '@/components/repositories/tabs/deployment/RepositoryDeploymentTab';
import { getRepositorieById } from '@/services/repository.service';
import { Separator } from '@workspace/ui/components/separator';
import { capitalizeFirstLetter, toDisplayLabel } from '@/utils/capitalize';
import Link from 'next/link';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';

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
    const repository = await getRepositorieById(repositoryId, { environment: true });
    if (!repository) notFound();

    const GitIcon = getGitIcon(repository.gitProvider);

    return (
        <BreadcrumbProvider segments={{ repositoryId: repository.name }}>
            <div className="flex h-full flex-1 flex-col pt-5">
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <GitIcon className="text-primary size-7" />
                            </div>
                            <div className="flex flex-col">
                                <Link
                                    href={repository.repositoryUrl}
                                    className={'group flex items-center gap-1'}
                                    target="_blank"
                                >
                                    <h1 className="text-3xl leading-none font-semibold tracking-tight group-hover:underline">
                                        {repository.name}
                                    </h1>
                                    <ExternalLink
                                        className={
                                            'size-4 opacity-0 transition-opacity group-hover:opacity-100'
                                        }
                                    />
                                </Link>
                                <div
                                    className={
                                        'text-muted-foreground flex items-center gap-2 text-sm'
                                    }
                                >
                                    <span>{capitalizeFirstLetter(repository.gitProvider)}</span>
                                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                    <p className="flex items-center gap-1">
                                        <GitBranch className="size-3" />
                                        <span>{repository.branch}</span>
                                    </p>
                                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                    <div className={'flex items-center gap-1'}>
                                        <Server className="size-3" />
                                        <span className={'truncate'}>
                                            {repository.environment?.name}
                                        </span>
                                    </div>
                                    <Separator orientation={'vertical'} className={'!h-3 w-1'} />
                                    <span className={'truncate'}>
                                        {toDisplayLabel(repository.buildType)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <RunBuildButton
                                repositoryId={repository.id}
                                environmentId={repository.environmentId}
                            />
                        </div>
                    </div>

                    <RepositoryTabs>
                        {{
                            builds: <RepositoryBuildsTab repositoryId={repository.id} />,
                            versions: (
                                <RepositoryVersionsTab
                                    repositoryId={repository.id}
                                    buildType={repository.buildType}
                                />
                            ),
                            env: <RepositoryEnvTab repositoryId={repository.id} />,
                            domain: <RepositoryDomainsTab repositoryId={repository.id} />,
                            deployment: <RepositoryDeploymentTab repositoryId={repository.id} />,
                            setting: <RepositorySettingsTab repositoryId={repository.id} />,
                        }}
                    </RepositoryTabs>
                </div>
            </div>
        </BreadcrumbProvider>
    );
}
