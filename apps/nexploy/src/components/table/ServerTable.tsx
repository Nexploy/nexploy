'use client';

import { ColumnDef, getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import type { PageSize } from '@workspace/typescript-interface/table';
import { type ServerTableFilters, useServerTable } from '@/hooks/useServerTable';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';

export interface ServerTableProps<TEntry> {
    endpoint: string;
    columns: ColumnDef<TEntry, any>[];
    emptyLabel: string;
    noResultsLabel: string;
    search?: string;
    filters?: ServerTableFilters;
    initialSorting?: SortingState;
    initialPageSize?: PageSize;
    revalidateToken?: number;
    revalidateOnFirstPageOnly?: boolean;
    enabled?: boolean;
    allowAllPageSize?: boolean;
    skeletonRows?: number;
    perPageLabel?: string;
    renderTotalLabel?: (total: number) => string;
    getRowId?: (row: TEntry) => string;
    onRowClick?: (row: TEntry) => void;
}

export function ServerTable<TEntry>({
    endpoint,
    columns,
    emptyLabel,
    noResultsLabel,
    search,
    filters,
    initialSorting,
    initialPageSize,
    revalidateToken,
    revalidateOnFirstPageOnly,
    enabled,
    allowAllPageSize = false,
    skeletonRows = 10,
    perPageLabel,
    renderTotalLabel,
    getRowId,
    onRowClick,
}: ServerTableProps<TEntry>) {
    const tCommon = useTranslations('common');

    const {
        rows,
        total,
        pageCount,
        pageIndex,
        pageSize,
        resolvedPageSize,
        sorting,
        isLoading,
        isFetching,
        setPageSize,
        setSorting,
        setPagination,
    } = useServerTable<TEntry>({
        endpoint,
        search,
        filters,
        initialSorting,
        initialPageSize,
        revalidateToken,
        revalidateOnFirstPageOnly,
        enabled,
    });

    const table = useReactTable({
        data: rows,
        columns,
        getRowId,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: Math.max(1, pageCount),
        rowCount: total,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination: { pageIndex, pageSize: resolvedPageSize },
        },
    });

    const hasActiveFilters = Boolean(search?.trim()) || Object.values(filters ?? {}).some(Boolean);
    const showPagination = !isLoading && (total > 0 || pageIndex > 0);

    return (
        <div className="space-y-3">
            <TableShell
                table={table}
                isLoading={isLoading}
                isFetching={isFetching}
                skeletonRows={skeletonRows}
                emptyLabel={emptyLabel}
                noResultsLabel={noResultsLabel}
                hasActiveFilters={hasActiveFilters}
                onRowClick={onRowClick}
            />

            {showPagination && (
                <TablePagination
                    table={table}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    perPageLabel={perPageLabel ?? tCommon('perPage')}
                    allowAllPageSize={allowAllPageSize}
                    totalLabel={renderTotalLabel?.(total)}
                />
            )}
        </div>
    );
}
