'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ColumnFiltersState,
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Input } from '@workspace/ui/components/input';
import { ContainerStatsSample } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { ContainersStatsHistoryPoint } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import { getColumnsContainersMetrics } from '@/components/monitoring/ColumnsContainersMetrics';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

interface ContainersMetricsTableProps {
    stats: ContainerStatsSample[];
    history: Record<string, ContainersStatsHistoryPoint[]>;
    onSelect: (container: ContainerStatsSample) => void;
}

const globalFilterFn: FilterFn<ContainerStatsSample> = (row, _, value) => {
    const search = String(value).toLowerCase();
    const { name, image, stack } = row.original;

    return (
        name.toLowerCase().includes(search) ||
        image.toLowerCase().includes(search) ||
        (stack ?? '').toLowerCase().includes(search)
    );
};

export function ContainersMetricsTable({ stats, history, onSelect }: ContainersMetricsTableProps) {
    const t = useTranslations('monitoring');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns = useMemo(() => getColumnsContainersMetrics(t, history), [t, history]);

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: stats,
        columns,
        getRowId: (container) => container.containerId,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn,
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

    return (
        <div className="space-y-3">
            <Input
                className="shadow-xs w-1/3"
                placeholder={t('table.searchPlaceholder')}
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
            />

            <TableShell table={table} emptyLabel={t('table.noContainers')} rowClassName="" onRowClick={onSelect} />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('table.perPage')}
                allowAllPageSize
            />
        </div>
    );
}
