'use client';

import { useEffect, useRef } from 'react';
import { Build } from 'generated/client';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBuildsInfinite } from '@/hooks/useBuildsInfinite';
import { RepositoryBuild } from '@/components/repositories/tabs/builds/RepositoryBuild';

interface BuildsHistoryListProps {
    repositoryId: string;
    initialBuilds: Build[];
    initialHasMore: boolean;
}

export function BuildsHistoryList({
    repositoryId,
    initialBuilds,
    initialHasMore,
}: BuildsHistoryListProps) {
    const t = useTranslations('repository.builds');
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { builds, hasMore, isLoadingMore, isValidating, setSize } = useBuildsInfinite(
        repositoryId,
        initialBuilds,
        initialHasMore,
    );

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isValidating) {
                    setSize((s) => s + 1);
                }
            },
            { rootMargin: '100px' },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isValidating, setSize]);

    if (builds.length === 0) {
        return (
            <div className="rounded-md border">
                <div className="text-muted-foreground p-8 text-center text-sm">
                    {t('noBuilds')}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y rounded-md border">
            {builds.map((build) => (
                <RepositoryBuild key={build.id} repositoryId={repositoryId} build={build} />
            ))}
            {hasMore && <div ref={sentinelRef} />}
            {isLoadingMore && (
                <div className="flex justify-center p-3">
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
            )}
        </div>
    );
}
