import { notFound } from 'next/navigation';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { StageSelect } from '@/components/repositories/stages/StageSelect';
import { RepositoryTabs } from '@/components/repositories/RepositoryTabs';
import { RepositoryEnvTab } from '@/components/repositories/tabs/envs/RepositoryEnvTab';
import { RepositoryDomainsTab } from '@/components/repositories/tabs/domains/RepositoryDomainsTab';
import { RepositorySettingsTab } from '@/components/repositories/tabs/settings/RepositorySettingsTab';
import { RepositoryVersionsTab } from '@/components/repositories/tabs/versions/RepositoryVersionsTab';
import { ExternalLink } from 'lucide-react';
import { RepositoryBuildsTab } from '@/components/repositories/tabs/builds/RepositoryBuildsTab';
import { RepositoryPipelineTab } from '@/components/repositories/tabs/pipeline/RepositoryPipelineTab';
import { getRepositorieById } from '@/services/repository.service';
import { capitalizeFirstLetter } from '@/utils/capitalize';
import { getHostname } from '@/utils/url';
import Link from 'next/link';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { Separator } from '@workspace/ui/components/separator';
import { ReassociateGitAccountDialog } from '@/components/repositories/reassociateGitAccount/ReassociateGitAccountDialog';
import { PROVIDER_ICONS } from '@/components/git/providerIcons.tsx';

interface RepositoryIdPageProps {
    params: Promise<{
        repositoryId: string;
    }>;
}

export default async function RepositoryIdPage({ params }: RepositoryIdPageProps) {
    const { repositoryId } = await params;
    const repository = await getRepositorieById(repositoryId, {
        gitAccount: { include: { gitProvider: { select: { baseUrl: true } } } },
    });
    if (!repository) notFound();

    const hostname = getHostname(repository.gitAccount?.gitProvider?.baseUrl);
    const ProviderIcon = PROVIDER_ICONS[repository.gitProvider];

    return (
        <BreadcrumbProvider segments={{ repositoryId: repository.name }}>
            <ReassociateGitAccountDialog
                repositoryId={repository.id}
                repositoryName={repository.name}
                open={!repository.gitAccountId}
            />
            <div className="flex h-full w-full flex-1 flex-col">
                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <ProviderIcon className="[&_path]:fill-primary size-7" />
                            </div>
                            <div className="mt-3.5 flex flex-col">
                                <Link
                                    href={repository.repositoryUrl}
                                    className={'group flex items-center gap-1'}
                                    target="_blank"
                                >
                                    <h1 className="line-clamp-1 text-3xl font-semibold tracking-tight break-all group-hover:underline">
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
                                    {hostname && (
                                        <>
                                            <Separator
                                                orientation={'vertical'}
                                                className={'!h-3 w-1'}
                                            />
                                            <span>{hostname}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center gap-2">
                            <StageSelect repositoryId={repository.id} />
                            <RunBuildButton repositoryId={repository.id} />
                        </div>
                    </div>

                    <RepositoryTabs>
                        {{
                            pipeline: <RepositoryPipelineTab repositoryId={repository.id} />,
                            builds: <RepositoryBuildsTab repositoryId={repository.id} />,
                            versions: <RepositoryVersionsTab repositoryId={repository.id} />,
                            env: <RepositoryEnvTab repositoryId={repository.id} />,
                            domain: <RepositoryDomainsTab repositoryId={repository.id} />,
                            setting: <RepositorySettingsTab repositoryId={repository.id} />,
                        }}
                    </RepositoryTabs>
                </div>
            </div>
        </BreadcrumbProvider>
    );
}
