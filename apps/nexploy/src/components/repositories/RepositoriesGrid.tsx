'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, } from '@workspace/ui/components/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '@workspace/ui/components/empty';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { FolderGit2 } from 'lucide-react';
import { Separator } from '@workspace/ui/components/separator';
import { StatusLive } from '@/components/shared/StatusLive';
import { RunBuildButton } from '@/components/repositories/RunBuildButton';
import { PROVIDER_ICONS } from '@/components/git/providerIcons.tsx';
import { capitalizeFirstLetter } from '@/utils/capitalize';
import { getHostname } from '@/utils/url';
import Github from '@thesvg/react/github';
import Gitlab from '@thesvg/react/gitlab';
import { STATUS_PIPELINE } from '@/components/pipeline/buildsPanel/BuildsPanelItem.tsx';

type BuildStatus = 'QUEUED' | 'BUILDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type GitProviderType = 'GITHUB' | 'GITLAB';

type Repository = {
    id: string;
    name: string;
    gitProvider: GitProviderType;
    build: { id: string; status: BuildStatus | null }[];
    gitAccount: {
        gitProvider: { baseUrl: string | null } | null;
    } | null;
};

interface RepositoriesGridProps {
    repositories: Repository[];
}

export function RepositoriesGrid({ repositories }: RepositoriesGridProps) {
    const t = useTranslations('repository');
    const tCommon = useTranslations('common');

    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState<GitProviderType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<BuildStatus | 'all'>('all');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return repositories.filter((repo) => {
            if (q && !repo.name.toLowerCase().includes(q)) return false;
            if (providerFilter !== 'all' && repo.gitProvider !== providerFilter) return false;
            if (statusFilter !== 'all') {
                const lastStatus = repo.build[0]?.status ?? null;
                if (lastStatus !== statusFilter) return false;
            }
            return true;
        });
    }, [repositories, search, providerFilter, statusFilter]);

    const hasFilters = search !== '' || providerFilter !== 'all' || statusFilter !== 'all';

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className={'flex gap-3'}>
                    <Select
                        value={providerFilter}
                        onValueChange={(value: GitProviderType) => setProviderFilter(value)}
                    >
                        <SelectTrigger className="w-36 shadow-xs">
                            <SelectValue placeholder={t('filterByProvider')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('filterByProvider')}</SelectLabel>
                                <SelectItem value="all">{tCommon('all')}</SelectItem>
                                <SelectItem value="GITHUB">
                                    <span className="flex items-center gap-2">
                                        <Github className="size-3.5 [&_path]:fill-current" />
                                        GitHub
                                    </span>
                                </SelectItem>
                                <SelectItem value="GITLAB">
                                    <span className="flex items-center gap-2">
                                        <Gitlab className="size-3.5 [&_path]:fill-current" />
                                        GitLab
                                    </span>
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(value: BuildStatus) => setStatusFilter(value)}
                    >
                        <SelectTrigger className="w-40 shadow-xs">
                            <SelectValue placeholder={t('filterByStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{tCommon('all')}</SelectItem>
                            {Object.entries(STATUS_PIPELINE).map(([status]) => (
                                <SelectItem key={status} value={status}>
                                    {t(`builds.${status.toLowerCase()}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filtered.length === 0 ? (
                hasFilters ? (
                    <Empty className="mt-16">
                        <EmptyHeader>
                            <EmptyMedia variant="icon" className="bg-primary/10">
                                <FolderGit2 className="text-primary" />
                            </EmptyMedia>
                            <EmptyDescription>{t('noRepositoriesMatchSearch')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <Empty className="mt-16">
                        <EmptyHeader>
                            <EmptyMedia variant="icon" className="bg-primary/10">
                                <FolderGit2 className="text-primary" />
                            </EmptyMedia>
                            <EmptyTitle>{t('noRepositories')}</EmptyTitle>
                            <EmptyDescription>{t('noRepositoriesDescription')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                    {filtered.map((repository) => {
                        const lastDeployment = repository.build?.[0];
                        const ProviderIcon = PROVIDER_ICONS[repository.gitProvider];
                        const hostname = getHostname(repository.gitAccount?.gitProvider?.baseUrl);

                        return (
                            <Link href={`/repositories/${repository.id}`} key={repository.id}>
                                <Card className="group border-muted-foreground/20 bg-background relative flex flex-col overflow-hidden p-4 px-0 pt-0 !pb-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl has-[button:hover]:scale-100 has-[button:hover]:shadow-none">
                                    <CardHeader className="flex flex-row items-start justify-between px-4">
                                        <div className="flex w-full items-center gap-3">
                                            <div className="bg-secondary/50 text-secondary-foreground ring-border group-hover:bg-primary/10 group-hover:text-primary group-has-[button:hover]:bg-secondary/50 group-has-[button:hover]:text-secondary-foreground mt-4 flex size-10 items-center justify-center rounded-full ring-1 transition-colors">
                                                <ProviderIcon className="size-5 [&_path]:fill-current" />
                                            </div>
                                            <div className="mt-3 flex min-w-0 flex-1 flex-col">
                                                <CardTitle className="truncate text-base font-semibold">
                                                    {repository.name}
                                                </CardTitle>
                                                <CardDescription className="text-muted-foreground/80 flex items-center gap-2 truncate font-mono text-xs">
                                                    {capitalizeFirstLetter(repository.gitProvider)}
                                                    {hostname && (
                                                        <>
                                                            <Separator
                                                                orientation="vertical"
                                                                className="!h-3 w-1"
                                                            />
                                                            <span className="truncate">
                                                                {hostname}
                                                            </span>
                                                        </>
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="bg-muted/40 text-muted-foreground flex h-14 justify-between border-t !p-3">
                                        <StatusLive
                                            key={lastDeployment?.id}
                                            buildId={lastDeployment?.id ?? null}
                                            initialStatus={lastDeployment?.status ?? undefined}
                                        />
                                        <RunBuildButton
                                            size="icon"
                                            showText={false}
                                            variant="secondary"
                                            repositoryId={repository.id}
                                        />
                                    </CardFooter>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
