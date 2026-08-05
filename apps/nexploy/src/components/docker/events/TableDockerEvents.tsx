'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import type { DockerEventData } from '@workspace/typescript-interface/docker/docker.events';
import { getColumnsDockerEvents } from '@/components/docker/events/ColumnsDockerEvents';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

interface TableDockerEventsProps {
    events: DockerEventData[];
    isLoading: boolean;
    emptyLabel: string;
}

export function TableDockerEvents({ events, isLoading, emptyLabel }: TableDockerEventsProps) {
    const t = useTranslations('docker');

    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(() => getColumnsDockerEvents(t), [t]);

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: events,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

    return (
        <div className="space-y-3">
            <TableShell table={table} className="mx-5" isLoading={isLoading} emptyLabel={emptyLabel} />

            {!isLoading && events.length > 0 && (
                <TablePagination
                    table={table}
                    className="mx-5"
                    pageSize={pagination.pageSize}
                    onPageSizeChange={pagination.setPageSize}
                    perPageLabel={t('eventsPerPage')}
                    allowAllPageSize
                />
            )}
        </div>
    );
}
