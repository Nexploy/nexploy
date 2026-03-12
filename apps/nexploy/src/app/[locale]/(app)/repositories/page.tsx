import type { Metadata } from 'next';
import { Folder, GitBranch, Github, Gitlab, Server } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { AddRepository } from '@/components/repositories/AddRepository';
import { Link } from '@/i18n/navigation';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { getRepositories } from '@/services/repository.service';
import { StatusLive } from '@/components/shared/StatusLive';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Separator } from '@workspace/ui/components/separator';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Repositories',
    description: 'Manage your Docker repositories',
};

const getGitIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('github')) return Github;
    if (p.includes('gitlab')) return Gitlab;
    return GitBranch;
};

export default async function RepositoriesPage() {
    const [repositories, t] = await Promise.all([getRepositories(), getTranslations('repository')]);

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between gap-2 px-5">
                    <div className={'flex gap-3'}>
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Folder className="text-primary size-7" />
                        </div>
                        <div className={'flex flex-col'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {t('title')}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {t('manageRepositories')}
                            </p>
                        </div>
                    </div>
                    <AddRepository />
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'px-5 pt-1 pb-5'}>
                        {repositories.length === 0 ? (
                            <Empty className={'mt-24'}>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon" className="bg-primary/10">
                                        <Folder className="text-primary" />
                                    </EmptyMedia>
                                    <EmptyTitle>{t('noRepositories')}</EmptyTitle>
                                    <EmptyDescription>
                                        {t('noRepositoriesDescription')}
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                                {repositories.map((repository) => {
                                    const lastDeployment = repository.build?.[0];
                                    const Icon = getGitIcon(repository.gitProvider);

                                    return (
                                        <Link
                                            href={`/repositories/${repository.id}`}
                                            key={repository.id}
                                        >
                                            <Card className="group border-muted-foreground/20 bg-background relative flex flex-col overflow-hidden p-4 px-0 pt-0 !pb-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl has-[button:hover]:scale-100 has-[button:hover]:shadow-none">
                                                <CardHeader className="flex flex-row items-start justify-between px-4">
                                                    <div className="flex w-full items-center gap-3">
                                                        <div className="bg-secondary/50 text-secondary-foreground ring-border group-hover:bg-primary/10 group-hover:text-primary group-has-[button:hover]:bg-secondary/50 group-has-[button:hover]:text-secondary-foreground mt-4 flex size-10 items-center justify-center rounded-full ring-1 transition-colors">
                                                            <Icon className="size-5" />
                                                        </div>
                                                        <div className="mt-3 flex min-w-0 flex-1 flex-col">
                                                            <CardTitle className="truncate text-base font-semibold">
                                                                {repository.name}
                                                            </CardTitle>
                                                            <CardDescription className="text-muted-foreground/80 flex items-center gap-2 truncate font-mono text-xs">
                                                                <div
                                                                    className={
                                                                        'flex min-w-0 items-center gap-1 truncate'
                                                                    }
                                                                >
                                                                    <GitBranch className="size-3 shrink-0" />
                                                                    <span className={'truncate'}>
                                                                        {repository.branch}
                                                                    </span>
                                                                </div>
                                                                <Separator
                                                                    orientation={'vertical'}
                                                                    className={'!h-3 w-1'}
                                                                />
                                                                <div
                                                                    className={
                                                                        'flex min-w-0 items-center gap-1'
                                                                    }
                                                                >
                                                                    <Server className="size-3 shrink-0" />
                                                                    <span className={'truncate'}>
                                                                        {
                                                                            repository.environment
                                                                                ?.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardFooter className="bg-muted/40 text-muted-foreground flex h-14 justify-between border-t !p-3">
                                                    <StatusLive
                                                        buildId={lastDeployment?.id}
                                                        initialStatus={lastDeployment?.status}
                                                    />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <RunBuildButton
                                                                mode={'onlyDeploy'}
                                                                size={'icon'}
                                                                showText={false}
                                                                variant={'secondary'}
                                                                environmentId={
                                                                    repository.environmentId
                                                                }
                                                                repositoryId={repository.id}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {t('runBuild')}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </CardFooter>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
