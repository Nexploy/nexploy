import { useCallback, useEffect, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Build } from 'generated/client';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { BUILDS_PAGE_SIZE } from '@/lib/constants';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';

type BuildsPage = { builds: Build[]; nextCursor: string | null };

export function useBuildsInfinite(
    repositoryId: string,
    initialBuilds: Build[],
    initialHasMore: boolean,
) {
    const fallbackData = useMemo<BuildsPage[]>(
        () => [
            {
                builds: initialBuilds,
                nextCursor: initialHasMore
                    ? (initialBuilds[initialBuilds.length - 1]?.id ?? null)
                    : null,
            },
        ],
        [],
    );

    const getKey = useCallback(
        (pageIndex: number, previousPageData: BuildsPage | null) => {
            if (previousPageData && !previousPageData.nextCursor) return null;
            if (pageIndex === 0)
                return { url: `/api/repositories/${repositoryId}/builds?take=${BUILDS_PAGE_SIZE}` };
            return {
                url: `/api/repositories/${repositoryId}/builds?take=${BUILDS_PAGE_SIZE}&cursor=${previousPageData!.nextCursor}`,
            };
        },
        [repositoryId],
    );

    const buildStartTrigger = usePipelineEditorStore((s) => s.buildStartTrigger);
    const buildDeleteTrigger = usePipelineEditorStore((s) => s.buildDeleteTrigger);

    const { data, size, setSize, isValidating, mutate } = useSWRInfinite<BuildsPage>(
        getKey,
        fetcherApi,
        {
            fallbackData,
            revalidateFirstPage: false,
            revalidateOnFocus: false,
        },
    );

    useEffect(() => {
        if (buildStartTrigger === 0) return;
        mutate();
    }, [buildStartTrigger]);

    useEffect(() => {
        if (buildDeleteTrigger === 0) return;
        mutate();
    }, [buildDeleteTrigger]);

    const builds = useMemo(
        () => data?.flatMap((page) => page.builds) ?? initialBuilds,
        [data, initialBuilds],
    );
    const hasMore = !!data?.[data.length - 1]?.nextCursor;
    const isLoadingMore = isValidating && !!(data && data.length < size);

    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore) return;
        setSize((s) => s + 1);
    }, [hasMore, isLoadingMore, setSize]);

    return { builds, hasMore, isLoadingMore, loadMore, isValidating, setSize };
}
