'use client';

import dayjs from 'dayjs';
import {
    FilterFn,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import React, { useCallback, useRef, useState } from 'react';
import { getColumnsTableNetworks } from '@/components/docker/network/table/ColumnsDockerNetworks';
import { useNetworksStore } from '../../../../stores/docker/useNetworksStore';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Eraser, Trash2 } from 'lucide-react';
import { Can } from '@/components/permission/Can';
import { Badge } from '@workspace/ui/components/badge';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { Switch } from '@workspace/ui/components/switch';
import { useTranslations } from 'next-intl';
import { useDockerStore } from '@/stores/docker/useDockerStore.ts';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';
import { useRouter } from '@/i18n/navigation';

const globalFilterFn: FilterFn<Network> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, driver, id, scope } = row.original;

    const date = dayjs.unix(row.original.created).format('DD/MM/YYYY');

    return (
        name?.toLowerCase().includes(search) ||
        driver?.toLowerCase().includes(search) ||
        scope?.toLowerCase().includes(search) ||
        id.toLowerCase().includes(search) ||
        date.toLowerCase().includes(search)
    );
};

export function TableDockerNetworks() {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});

    const statusDocker = useDockerStore((state) => state.status);

    const networks = useNetworksStore((state) => state.networks);
    const lastUpdate = useNetworksStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('docker.tables');
    const tDocker = useTranslations('docker');
    const tCommon = useTranslations('common');

    const router = useRouter();

    const isLoading = !networks.length && !lastUpdate;
    const isEmpty = !networks.length && !!lastUpdate;

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: networks,
        columns: getColumnsTableNetworks(t),
        getRowId: (originalRow: Network) => originalRow.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        onPaginationChange: pagination.onPaginationChange,
        state: {
            sorting,
            globalFilter,
            rowSelection,
            pagination: pagination.state,
        },
    });

    pagination.clampToPageCount(table.getPageCount());

    const numberOfSelectedRows = Object.keys(rowSelection).length;
    const forceRef = useRef(false);

    const handleDeleteAction = useCallback(() => {
        const networkIds = Object.keys(rowSelection);
        forceRef.current = false;
        openAlertDialog({
            title: tDocker('deleteNetwork'),
            description: (
                <div className={'space-y-4'}>
                    <p>{tDocker('confirmDeleteNetwork')}</p>
                    <label
                        htmlFor={'force-delete'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>{tDocker('errors.forceDelete')}</p>
                            <p className={'text-xs'}>{tDocker('errors.forceDeleteDescription')}</p>
                        </div>
                        <Switch
                            id={'force-delete'}
                            className={'data-[state=checked]:bg-destructive!'}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </label>
                </div>
            ),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            onAction: async () => {
                const result = await onNetworkAction({
                    networkIds,
                    action: 'delete',
                    force: forceRef.current,
                });
                if (!result?.serverError) {
                    table.resetRowSelection();
                }
            },
        });
    }, [rowSelection, openAlertDialog, tDocker, tCommon, table]);

    const handlePruneAction = useCallback(() => {
        openAlertDialog({
            title: tDocker('pruneNetworks'),
            description: tDocker('confirmPruneNetworks'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tDocker('prune'),
            onAction: async () => {
                await onNetworkAction({ networkIds: [], action: 'prune' });
            },
        });
    }, [openAlertDialog, tDocker, tCommon]);

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex flex-wrap justify-between gap-3'}>
                <Input
                    className={'w-56 shadow-xs'}
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex flex-wrap gap-3'}>
                    <Can resource="network" action="manage">
                        <Button
                            variant={'outline'}
                            icon={Eraser}
                            onClick={handlePruneAction}
                            disabled={statusDocker !== 'connected'}
                        >
                            {tDocker('prune')}
                        </Button>
                    </Can>
                    <Button
                        variant={'destructive'}
                        onClick={handleDeleteAction}
                        disabled={numberOfSelectedRows === 0 || statusDocker !== 'connected'}
                        icon={Trash2}
                    >
                        {tCommon('remove')}
                        {numberOfSelectedRows > 1 && (
                            <Badge variant={'secondary'} className={'rounded-full'}>
                                {numberOfSelectedRows}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>
            <TableShell
                table={table}
                isLoading={isLoading}
                skeletonRows={5}
                emptyLabel={tDocker('noNetworks')}
                noResultsLabel={tCommon('noMatchSearch')}
                hasActiveFilters={!isEmpty}
                onRowClick={(network) => router.push(`/docker/networks/${network.id}`)}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={tCommon('perPage')}
                allowAllPageSize
            />
        </div>
    );
}
