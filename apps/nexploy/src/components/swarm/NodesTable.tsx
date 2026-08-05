'use client';

import {
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getColumnsTableNodes } from './ColumnsDockerNodes';
import { useTranslations } from 'next-intl';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@workspace/ui/components/empty';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';

const globalFilterFn: FilterFn<SwarmNode> = (row, _, value) => {
    const search = value.toLowerCase();
    const { hostname, role, state, availability, address, engineVersion } = row.original;
    return (
        hostname.toLowerCase().includes(search) ||
        role.toLowerCase().includes(search) ||
        state.toLowerCase().includes(search) ||
        availability.toLowerCase().includes(search) ||
        (address || '').toLowerCase().includes(search) ||
        (engineVersion || '').toLowerCase().includes(search)
    );
};

export function NodesTable() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const t = useTranslations('swarm');
    const tCommon = useTranslations('common');
    const router = useRouter();

    const nodes = useSwarmStore((state) => state.nodes);
    const isSwarmActive = useSwarmStore((state) => state.isSwarmActive);
    const lastUpdate = useSwarmStore((state) => state.lastUpdate);

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: nodes,
        columns: getColumnsTableNodes(t),
        getRowId: (row: SwarmNode) => row.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: pagination.onPaginationChange,
        state: { sorting, globalFilter, pagination: pagination.state },
    });

    pagination.clampToPageCount(table.getPageCount());

    if (!isSwarmActive) return null;

    const isLoading = nodes.length === 0 && !lastUpdate;
    const isEmpty = nodes.length === 0 && !!lastUpdate;
    const noMatch = !isEmpty && nodes.length > 0 && table.getRowModel().rows.length === 0;

    if (isEmpty) {
        return (
            <div className="px-5">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <Server className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t('noNodesFound')}</EmptyTitle>
                        <EmptyDescription>{t('noNodesDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        <div className="mx-5 space-y-3">
            <div className="pt-1">
                <Input
                    className="w-56 shadow-xs"
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <TableShell table={table} isLoading={isLoading} skeletonRows={3} emptyLabel={tCommon('noMatchSearch')} />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('nodesPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
