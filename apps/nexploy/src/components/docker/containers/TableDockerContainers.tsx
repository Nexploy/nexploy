'use client';

import {
    ExpandedState,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import { cn } from '@workspace/ui/lib/utils';
import { buildContainerRows, containerTableGlobalFilterFn, ContainerTableRow } from './containerTableUtils';
import { getColumnsDockerContainers } from './ColumnsDockerContainers';
import { ContainerTableActions } from './ContainerTableActions';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';
import { useRouter } from '@/i18n/navigation';

interface TableDockerContainersProps {
    containers: Containers[];
    isLoading: boolean;
    search?: string;
}

function getSelectedContainers(rows: ContainerTableRow[], selectedIds: string[]): ContainerTableRow[] {
    return rows.flatMap((r) => (r.isGroup ? (r.subRows ?? []) : [r])).filter((r) => selectedIds.includes(r.id));
}

export function TableDockerContainers({ containers, isLoading, search = '' }: TableDockerContainersProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const t = useTranslations('docker.tables');
    const tCommon = useTranslations('common');

    const router = useRouter();

    const containerRows = useMemo(() => buildContainerRows(containers), [containers]);
    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: containerRows,
        columns: getColumnsDockerContainers(t, tCommon),
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onExpandedChange: setExpanded,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: containerTableGlobalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowId: (row) => row.id,
        getSubRows: (row) => row.subRows,
        onPaginationChange: pagination.onPaginationChange,
        state: { sorting, globalFilter: search, expanded, rowSelection, pagination: pagination.state },
    });

    pagination.clampToPageCount(table.getPageCount());

    const selectedIds = Object.keys(rowSelection);
    const selectedContainers = useMemo(
        () => getSelectedContainers(containerRows, selectedIds),
        [containerRows, selectedIds],
    );

    const isEmpty = !isLoading && containerRows.length === 0;

    return (
        <div className="mx-5 space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <ContainerTableActions
                    selectedContainers={selectedContainers}
                    onResetSelection={() => table.resetRowSelection()}
                />
            </div>

            <TableShell
                table={table}
                isLoading={isLoading}
                skeletonRows={5}
                emptyLabel={t('noContainersFound')}
                noResultsLabel={t('noContainersMatchSearch')}
                hasActiveFilters={!isEmpty}
                rowClassName={(row) => cn('h-12', row.original.isGroup && 'bg-muted/30')}
                onRowClick={(container, row) => {
                    if (container.isGroup) {
                        row.toggleExpanded();
                        return;
                    }
                    router.push(`/docker/containers/${container.id}`);
                }}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('containersPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
