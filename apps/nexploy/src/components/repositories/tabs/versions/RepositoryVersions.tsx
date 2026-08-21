'use client';

import { useCallback, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Boxes, Clock, Container, GitBranch, GitCommit, Tag } from 'lucide-react';
import dayjs from 'dayjs';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { usePipelineStage } from '@/hooks/pipeline/usePipelineStage.ts';
import { useScrollAreaViewport } from '@/hooks/useScrollAreaViewport';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { NEXPLOY_LABELS } from '@nexploy/shared/nexployLabels';
import { VersionDeployButton } from '@/components/repositories/tabs/versions/VersionDeployButton.tsx';
import { VersionDropdownActions } from '@/components/repositories/tabs/versions/VersionDropdownActions';

const ESTIMATED_HEADER_HEIGHT = 36;
const ESTIMATED_VERSION_HEIGHT = 73;
const OVERSCAN = 6;

type VersionRow =
    | { type: 'header'; id: string; name: string; isFirstGroup: boolean }
    | { type: 'version'; id: string; version: Version; isFirstOfGroup: boolean; isLastOfGroup: boolean };

interface RepositoryVersionsProps {
    repositoryId: string;
    versions: Version[];
}

export function RepositoryVersions({ repositoryId, versions: initialVersions }: RepositoryVersionsProps) {
    const t = useTranslations('repository.versions');
    const tBuilds = useTranslations('repository.builds');

    const { stageId } = usePipelineStage(repositoryId);

    const { data } = useSWR<{ versions: Version[] }>(
        stageId ? { url: `/api/repositories/${repositoryId}/versions?stage=${stageId}` } : null,
        fetcherApi,
    );
    const versions = data?.versions ?? initialVersions;

    const containers = useContainersStore((s) => s.containers);

    const { deployedBuildIds, containerNameByBuildId } = useMemo(() => {
        const ids = new Set<string>();
        const nameMap = new Map<string, string>();
        for (const container of containers) {
            if (container.labels?.[NEXPLOY_LABELS.repositoryId] === repositoryId) {
                const buildId = container.labels?.[NEXPLOY_LABELS.buildId];
                if (buildId) {
                    ids.add(buildId);
                    if (!nameMap.has(buildId)) nameMap.set(buildId, container.name);
                }
            }
        }
        return { deployedBuildIds: ids, containerNameByBuildId: nameMap };
    }, [containers, repositoryId]);

    const isCurrentVersion = (version: Version) => deployedBuildIds.has(version.imageTag);

    const rows = useMemo<VersionRow[]>(() => {
        const groups = versions.reduce<Map<string, { name: string; versions: Version[] }>>((acc, version) => {
            const key = version.environmentId ?? 'none';
            if (!acc.has(key)) {
                acc.set(key, {
                    name: version.environmentName ?? tBuilds('noEnvironment'),
                    versions: [],
                });
            }
            acc.get(key)!.versions.push(version);
            return acc;
        }, new Map());

        const result: VersionRow[] = [];
        let groupIndex = 0;

        for (const [key, group] of groups) {
            result.push({ type: 'header', id: `header-${key}`, name: group.name, isFirstGroup: groupIndex === 0 });
            group.versions.forEach((version, index) => {
                result.push({
                    type: 'version',
                    id: `${version.repositoryId}-${version.imageTag}`,
                    version,
                    isFirstOfGroup: index === 0,
                    isLastOfGroup: index === group.versions.length - 1,
                });
            });
            groupIndex++;
        }

        return result;
    }, [versions, tBuilds]);

    const listRef = useRef<HTMLDivElement>(null);
    const { scrollElement, scrollMargin } = useScrollAreaViewport(listRef);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement,
        estimateSize: useCallback(
            (index: number) => (rows[index]?.type === 'header' ? ESTIMATED_HEADER_HEIGHT : ESTIMATED_VERSION_HEIGHT),
            [rows],
        ),
        getItemKey: useCallback((index: number) => rows[index]?.id ?? index, [rows]),
        overscan: OVERSCAN,
        scrollMargin,
    });

    const renderVersion = (version: Version, isFirstOfGroup: boolean, isLastOfGroup: boolean) => {
        const isCurrent = isCurrentVersion(version);
        const containerName = containerNameByBuildId.get(version.imageTag);
        return (
            <div
                className={cn(
                    'flex items-center justify-between gap-4 border-x border-b bg-card p-3',
                    isFirstOfGroup && 'rounded-t-md border-t',
                    isLastOfGroup && 'rounded-b-md',
                )}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant={isCurrent ? 'default' : 'secondary'} className="shrink-0 font-mono text-xs">
                            v{version.versionNumber}
                        </Badge>
                        <span className="line-clamp-1 truncate font-medium text-sm">
                            {version.commitMessage ?? `Build #${version.imageTag}`}
                        </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                        <span className="flex shrink-0 items-center gap-1">
                            <Clock className="size-3 shrink-0" />
                            {dayjs(version.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </span>
                        {version.commitHash && (
                            <>
                                <Separator orientation="vertical" className="h-3! w-1 shrink-0" />
                                <span className="flex min-w-0 items-center gap-1 font-mono">
                                    <GitCommit className="size-3 shrink-0" />
                                    <span className="truncate">{version.commitHash}</span>
                                </span>
                            </>
                        )}
                        {version.branch && (
                            <>
                                <Separator orientation="vertical" className="h-3! w-1 shrink-0" />
                                <span className="flex min-w-0 items-center gap-1">
                                    <GitBranch className="size-3 shrink-0" />
                                    <span className="truncate">{version.branch}</span>
                                </span>
                            </>
                        )}
                        {version.hasComposeConfig ? (
                            <>
                                <Separator orientation="vertical" className="h-3! w-1 shrink-0" />
                                <span className="flex min-w-0 items-center gap-1">
                                    <Boxes className="size-3 shrink-0" />
                                    <span className="truncate">{t('stack')}</span>
                                </span>
                            </>
                        ) : (
                            containerName && (
                                <>
                                    <Separator orientation="vertical" className="h-3! w-1 shrink-0" />
                                    <span className="flex min-w-0 items-center gap-1">
                                        <Container className="size-3 shrink-0" />
                                        <span className="truncate">{containerName}</span>
                                    </span>
                                </>
                            )
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <VersionDeployButton version={version} repositoryId={repositoryId} isCurrent={isCurrent} />
                    <VersionDropdownActions version={version} repositoryId={repositoryId} />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="font-semibold text-xl">{t('title')}</h2>
            {versions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-md border p-8 text-center">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{t('noVersions')}</span>
                        <span className="text-muted-foreground text-sm">{t('noVersionsDescription')}</span>
                    </div>
                </div>
            ) : (
                <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const row = rows[virtualItem.index];
                        if (!row) return null;

                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                className="absolute top-0 left-0 w-full"
                                style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
                            >
                                {row.type === 'header' ? (
                                    <h3
                                        className={cn(
                                            'px-1 pb-1 font-medium text-muted-foreground text-sm',
                                            !row.isFirstGroup && 'pt-4',
                                        )}
                                    >
                                        {row.name}
                                    </h3>
                                ) : (
                                    renderVersion(row.version, row.isFirstOfGroup, row.isLastOfGroup)
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
