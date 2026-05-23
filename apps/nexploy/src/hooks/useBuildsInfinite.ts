import { useCallback, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Build } from 'generated/client';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';

const PAGE_SIZE = 20;

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
                return `/api/repositories/${repositoryId}/builds?take=${PAGE_SIZE}`;
            return `/api/repositories/${repositoryId}/builds?take=${PAGE_SIZE}&cursor=${previousPageData!.nextCursor}`;
        },
        [repositoryId],
    );

    const { data, size, setSize, isValidating } = useSWRInfinite<BuildsPage>(getKey, fetcherApi, {
        fallbackData,
        revalidateFirstPage: false,
        revalidateOnFocus: false,
    });

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
