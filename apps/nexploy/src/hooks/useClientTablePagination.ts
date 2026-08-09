'use client';

import { useCallback, useMemo, useState } from 'react';
import type { OnChangeFn, PaginationState } from '@tanstack/react-table';
import { PAGE_SIZE_ALL, type PageSize } from '@workspace/typescript-interface/table';
import { PAGE_SIZE_DEFAULT } from '@/lib/constants';

export interface UseClientTablePaginationResult {
    pageSize: PageSize;
    isShowingAll: boolean;
    state: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    setPageSize: (pageSize: PageSize) => void;
    clampToPageCount: (pageCount: number) => void;
}

export function useClientTablePagination(
    initialPageSize: PageSize = PAGE_SIZE_DEFAULT,
): UseClientTablePaginationResult {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSizeState] = useState<PageSize>(initialPageSize);

    const isShowingAll = pageSize === PAGE_SIZE_ALL;
    const resolvedPageSize = isShowingAll ? Number.MAX_SAFE_INTEGER : pageSize;

    const state = useMemo<PaginationState>(
        () => ({ pageIndex, pageSize: resolvedPageSize }),
        [pageIndex, resolvedPageSize],
    );

    const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
        (updater) => {
            const next = typeof updater === 'function' ? updater(state) : updater;

            if (next.pageSize !== state.pageSize && !isShowingAll) {
                setPageSizeState(Math.max(1, next.pageSize));
                setPageIndex(0);
                return;
            }

            setPageIndex(Math.max(0, next.pageIndex));
        },
        [state, isShowingAll],
    );

    const setPageSize = useCallback((nextPageSize: PageSize) => {
        setPageSizeState(nextPageSize);
        setPageIndex(0);
    }, []);

    const clampToPageCount = useCallback(
        (pageCount: number) => {
            if (pageIndex > 0 && pageIndex >= pageCount) setPageIndex(Math.max(0, pageCount - 1));
        },
        [pageIndex],
    );

    return { pageSize, isShowingAll, state, onPaginationChange, setPageSize, clampToPageCount };
}
