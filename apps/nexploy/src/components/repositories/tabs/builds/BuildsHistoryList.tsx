'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Build } from 'generated/client';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@workspace/ui/lib/utils';
import { useBuildsInfinite } from '@/hooks/useBuildsInfinite';
import { useScrollAreaViewport } from '@/hooks/useScrollAreaViewport';
import { RepositoryBuild } from '@/components/repositories/tabs/builds/RepositoryBuild';

const ESTIMATED_BUILD_HEIGHT = 73;
const OVERSCAN = 6;

interface BuildsHistoryListProps {
    repositoryId: string;
    stageId: string | null;
    initialBuilds: Build[];
    initialHasMore: boolean;
}

export function BuildsHistoryList({ repositoryId, stageId, initialBuilds, initialHasMore }: BuildsHistoryListProps) {
    const t = useTranslations('repository.builds');
    const listRef = useRef<HTMLDivElement>(null);

    const { builds, hasMore, isLoadingMore, loadMore } = useBuildsInfinite(
        repositoryId,
        stageId,
        initialBuilds,
        initialHasMore,
    );

    const { scrollElement, scrollMargin } = useScrollAreaViewport(listRef);

    const virtualizer = useVirtualizer({
        count: builds.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => ESTIMATED_BUILD_HEIGHT,
        getItemKey: useCallback((index: number) => builds[index]?.id ?? index, [builds]),
        overscan: OVERSCAN,
        scrollMargin,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;

    useEffect(() => {
        if (!hasMore || isLoadingMore) return;
        if (lastVisibleIndex >= builds.length - 1) loadMore();
    }, [lastVisibleIndex, builds.length, hasMore, isLoadingMore, loadMore]);

    if (builds.length === 0) {
        return (
            <div className="rounded-md border">
                <div className="p-8 text-center text-muted-foreground text-sm">{t('noBuilds')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualItems.map((virtualItem) => {
                    const build = builds[virtualItem.index];
                    if (!build) return null;

                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            className="absolute top-0 left-0 w-full"
                            style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
                        >
                            <div
                                className={cn(
                                    'overflow-hidden border-x border-b',
                                    virtualItem.index === 0 && 'rounded-t-md border-t',
                                    virtualItem.index === builds.length - 1 && 'rounded-b-md',
                                )}
                            >
                                <RepositoryBuild repositoryId={repositoryId} build={build} />
                            </div>
                        </div>
                    );
                })}
            </div>
            {isLoadingMore && (
                <div className="flex justify-center p-3">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
