'use client';

import {
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@workspace/ui/components/empty';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { getColumnsSwarmServices } from './ColumnsSwarmServices';
import { ServiceTableActions } from './ServiceTableActions';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

const globalFilterFn: FilterFn<SwarmService> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, image, mode } = row.original;
    return (
        name.toLowerCase().includes(search) ||
        image.toLowerCase().includes(search) ||
        mode.toLowerCase().includes(search)
    );
};

export function ServicesTable() {
    const services = useSwarmStore((state) => state.services);
    const lastUpdate = useSwarmStore((state) => state.lastUpdate);

    const getTasksByService = useSwarmStore((state) => state.getTasksByService);

    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const getRunningTasksCount = useMemo(
        () => (serviceId: string) => getTasksByService(serviceId).filter((task) => task.state === 'running').length,
        [getTasksByService],
    );

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: services,
        columns: getColumnsSwarmServices(t, getRunningTasksCount),
        getRowId: (row) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: { sorting, globalFilter, rowSelection, pagination: pagination.state },
    });

    pagination.clampToPageCount(table.getPageCount());

    const selectedIds = Object.keys(rowSelection);
    const selectedServices = services.filter((s) => selectedIds.includes(s.id));

    const isLoading = services.length === 0 && !lastUpdate;
    const isEmpty = services.length === 0 && !!lastUpdate;
    const noMatch = !isEmpty && services.length > 0 && table.getRowModel().rows.length === 0;

    if (isEmpty) {
        return (
            <div className="px-5">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <Layers className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t('noServicesFound')}</EmptyTitle>
                        <EmptyDescription>{t('noServicesDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        <div className="mx-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <ServiceTableActions
                    selectedServices={selectedServices}
                    onResetSelection={() => table.resetRowSelection()}
                />
            </div>

            <TableShell table={table} isLoading={isLoading} skeletonRows={3} emptyLabel={tCommon('noMatchSearch')} />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('servicesPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
