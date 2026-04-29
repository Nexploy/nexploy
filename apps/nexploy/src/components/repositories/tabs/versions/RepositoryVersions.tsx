'use client';

import { useMemo } from 'react';
import { Boxes, Clock, Container, GitBranch, GitCommit } from 'lucide-react';
import dayjs from 'dayjs';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { useTranslations } from 'next-intl';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { VersionDeployButton } from '@/components/repositories/tabs/versions/VersionDeployButton.tsx';
import { VersionDropdownActions } from '@/components/repositories/tabs/versions/VersionDropdownActions';

interface RepositoryVersionsProps {
    repositoryId: string;
    versions: Version[];
}

export function RepositoryVersions({ repositoryId, versions }: RepositoryVersionsProps) {
    const t = useTranslations('repository.versions');
    const tBuilds = useTranslations('repository.builds');

    const containers = useContainersStore((s) => s.containers);

    const { deployedBuildIds, containerNameByBuildId } = useMemo(() => {
        const ids = new Set<string>();
        const nameMap = new Map<string, string>();
        for (const c of containers) {
            if (c.labels?.[NEXPLOY_LABELS.repositoryId] === repositoryId) {
                const buildId = c.labels?.[NEXPLOY_LABELS.buildId];
                if (buildId) {
                    ids.add(buildId);
                    if (!nameMap.has(buildId)) nameMap.set(buildId, c.name);
                }
            }
        }
        return { deployedBuildIds: ids, containerNameByBuildId: nameMap };
    }, [containers, repositoryId]);

    const isCurrentVersion = (version: Version) => deployedBuildIds.has(version.imageTag);

    const groups = versions.reduce<Map<string | undefined, { name: string; versions: Version[] }>>(
        (acc, version) => {
            const key = version.environmentId ?? undefined;
            if (!acc.has(key)) {
                acc.set(key, {
                    name: version.environmentName ?? tBuilds('noEnvironment'),
                    versions: [],
                });
            }
            acc.get(key)!.versions.push(version);
            return acc;
        },
        new Map(),
    );

    const renderVersion = (version: Version) => {
        const isCurrent = isCurrentVersion(version);
        return (
            <div
                key={`${version.repositoryId}-${version.imageTag}`}
                className="flex items-center justify-between gap-4 p-3"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isCurrent ? 'default' : 'secondary'}
                            className="font-mono text-xs"
                        >
                            v{version.versionNumber}
                        </Badge>
                        <span className="line-clamp-1 text-sm font-medium">
                            {version.commitMessage ?? `Build #${version.imageTag}`}
                        </span>
                    </div>
                    <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {dayjs(version.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                        {version.commitHash && (
                            <>
                                <Separator orientation="vertical" className="!h-3 w-1" />
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="size-3" />
                                    {version.commitHash}
                                </span>
                            </>
                        )}
                        {version.branch && (
                            <>
                                <Separator orientation="vertical" className="!h-3 w-1" />
                                <span className="flex items-center gap-1">
                                    <GitBranch className="size-3" />
                                    {version.branch}
                                </span>
                            </>
                        )}
                        <Separator orientation="vertical" className="!h-3 w-1" />
                        {version.hasComposeConfig ? (
                            <span className="flex items-center gap-1">
                                <Boxes className="size-3" />
                                {t('stack')}
                            </span>
                        ) : (
                            <span className="flex min-w-0 items-center gap-1">
                                <Container className="size-3 shrink-0" />
                                <span className="truncate">
                                    {containerNameByBuildId.get(version.imageTag)}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <VersionDeployButton
                        version={version}
                        repositoryId={repositoryId}
                        isCurrent={isCurrent}
                    />
                    <VersionDropdownActions version={version} repositoryId={repositoryId} />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            {versions.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                    {t('noVersions')}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {Array.from(groups.entries()).map(([key, group]) => (
                        <div key={key ?? 'none'} className="flex flex-col gap-1">
                            <h3 className="text-muted-foreground px-1 text-sm font-medium">
                                {group.name}
                            </h3>
                            <div className="rounded-md border">
                                <div className="divide-y">{group.versions.map(renderVersion)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
