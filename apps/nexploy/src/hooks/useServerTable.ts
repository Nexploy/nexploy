'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { PAGE_SIZE_ALL, type PageSize, type PaginatedResult } from '@workspace/typescript-interface/table';
import { PAGE_SIZE_DEFAULT } from '@/lib/constants';
import { fetcherApi, isAbortError } from '@/lib/api/fetcherApi';

export type ServerTableFilters = Record<string, string | number | boolean | null | undefined>;

export interface UseServerTableOptions {
    endpoint: string;
    filters?: ServerTableFilters;
    search?: string;
    initialSorting?: SortingState;
    initialPageSize?: PageSize;
    revalidateToken?: number;
    revalidateOnFirstPageOnly?: boolean;
    enabled?: boolean;
}

export interface UseServerTableResult<TEntry> {
    rows: TEntry[];
    total: number;
    pageCount: number;
    pageIndex: number;
    pageSize: PageSize;
    isShowingAll: boolean;
    sorting: SortingState;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    canPreviousPage: boolean;
    canNextPage: boolean;
    setPageIndex: (pageIndex: number) => void;
    setPageSize: (pageSize: PageSize) => void;
    setSorting: OnChangeFn<SortingState>;
    setPagination: OnChangeFn<PaginationState>;
    resolvedPageSize: number;
    previousPage: () => void;
    nextPage: () => void;
    refresh: () => void;
}

function buildQueryString(
    pageIndex: number,
    pageSize: PageSize,
    sorting: SortingState,
    search: string | undefined,
    filters: ServerTableFilters | undefined,
): string {
    const params = new URLSearchParams();

    params.set('page', String(pageIndex + 1));
    params.set('pageSize', String(pageSize));

    const trimmedSearch = search?.trim();
    if (trimmedSearch) params.set('search', trimmedSearch);

    const [sort] = sorting;
    if (sort) {
        params.set('sortBy', sort.id);
        params.set('sortOrder', sort.desc ? 'desc' : 'asc');
    }

    for (const [key, value] of Object.entries(filters ?? {})) {
        if (value === undefined || value === null || value === '') continue;
        params.set(key, String(value));
    }

    params.sort();

    return params.toString();
}

export function useServerTable<TEntry>({
    endpoint,
    filters,
    search,
    initialSorting = [],
    initialPageSize = PAGE_SIZE_DEFAULT,
    revalidateToken = 0,
    revalidateOnFirstPageOnly = true,
    enabled = true,
}: UseServerTableOptions): UseServerTableResult<TEntry> {
    const [pageIndex, setPageIndexState] = useState(0);
    const [pageSize, setPageSizeState] = useState<PageSize>(initialPageSize);
    const [sorting, setSortingState] = useState<SortingState>(initialSorting);
    const [page, setPage] = useState<PaginatedResult<TEntry> | null>(null);
    const [isFetching, setIsFetching] = useState(enabled);
    const [error, setError] = useState<string | null>(null);
    const [manualRevision, setManualRevision] = useState(0);

    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
    const pendingResetRef = useRef(false);

    const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);
    const sortingKey = useMemo(() => JSON.stringify(sorting), [sorting]);
    const resetKey = `${endpoint}|${filtersKey}|${search?.trim() ?? ''}|${sortingKey}|${pageSize}`;
    const previousResetKeyRef = useRef(resetKey);

    const filtersRef = useRef(filters);
    const sortingRef = useRef(sorting);
    filtersRef.current = filters;
    sortingRef.current = sorting;

    const queryString = useMemo(
        () => buildQueryString(pageIndex, pageSize, sortingRef.current, search, filtersRef.current),
        [pageIndex, pageSize, sortingKey, filtersKey, search],
    );

    useEffect(() => {
        if (previousResetKeyRef.current === resetKey) return;

        previousResetKeyRef.current = resetKey;

        setPageIndexState((current) => {
            if (current === 0) return current;

            pendingResetRef.current = true;

            return 0;
        });
    }, [resetKey]);

    const effectiveRevalidateToken = revalidateOnFirstPageOnly && pageIndex !== 0 ? 0 : revalidateToken;

    useEffect(() => {
        if (!enabled) return;
        if (pendingResetRef.current && pageIndex !== 0) return;

        pendingResetRef.current = false;

        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setIsFetching(true);

        fetcherApi<PaginatedResult<TEntry>>({
            url: `${endpoint}?${queryString}`,
            signal: controller.signal,
            disableToast: true,
        })
            .then((result) => {
                if (requestIdRef.current !== requestId) return;

                setPage(result);
                setError(null);
                setIsFetching(false);

                if (result.page - 1 !== pageIndex) setPageIndexState(Math.max(0, result.page - 1));
            })
            .catch((fetchError: unknown) => {
                if (isAbortError(fetchError) || requestIdRef.current !== requestId) return;

                setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
                setIsFetching(false);
            });

        return () => controller.abort();
    }, [enabled, endpoint, queryString, pageIndex, effectiveRevalidateToken, manualRevision]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const setPageIndex = useCallback((nextPageIndex: number) => {
        setPageIndexState(Math.max(0, nextPageIndex));
    }, []);

    const setPageSize = useCallback((nextPageSize: PageSize) => {
        setPageSizeState(nextPageSize === PAGE_SIZE_ALL ? PAGE_SIZE_ALL : Math.max(1, nextPageSize));
    }, []);

    const setSorting = useCallback<OnChangeFn<SortingState>>((updater) => {
        setSortingState((current) => (typeof updater === 'function' ? updater(current) : updater));
    }, []);

    const isShowingAll = pageSize === PAGE_SIZE_ALL;
    const resolvedPageSize = isShowingAll ? Math.max(1, page?.total ?? 1) : pageSize;
    const pageCount = isShowingAll ? 1 : (page?.pageCount ?? 0);
    const canPreviousPage = !isShowingAll && pageIndex > 0;
    const canNextPage = !isShowingAll && pageIndex + 1 < pageCount;

    const previousPage = useCallback(() => {
        setPageIndexState((current) => Math.max(0, current - 1));
    }, []);

    const nextPage = useCallback(() => {
        setPageIndexState((current) => (current + 1 < pageCount ? current + 1 : current));
    }, [pageCount]);

    const setPagination = useCallback<OnChangeFn<PaginationState>>(
        (updater) => {
            const current: PaginationState = { pageIndex, pageSize: resolvedPageSize };
            const next = typeof updater === 'function' ? updater(current) : updater;

            if (next.pageIndex !== current.pageIndex) setPageIndexState(Math.max(0, next.pageIndex));
        },
        [pageIndex, resolvedPageSize],
    );

    const refresh = useCallback(() => setManualRevision((current) => current + 1), []);

    return {
        rows: page?.entries ?? [],
        total: page?.total ?? 0,
        pageCount,
        pageIndex,
        pageSize,
        isShowingAll,
        sorting,
        isLoading: page === null && isFetching,
        isFetching,
        error,
        canPreviousPage,
        canNextPage,
        setPageIndex,
        setPageSize,
        setSorting,
        setPagination,
        resolvedPageSize,
        previousPage,
        nextPage,
        refresh,
    };
}
