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
import React, { useState } from 'react';
import { getColumnsTableVolumes } from '@/components/docker/volume/table/ColumnsDockerVolumes';
import { useTranslations } from 'next-intl';
import { useVolumesStore } from '@/stores/docker/useVolumesStore.ts';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import { Badge } from '@workspace/ui/components/badge';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { useDockerStore } from '@/stores/docker/useDockerStore.ts';
import { TableShell } from '@/components/table/TableShell';
import { TablePagination } from '@/components/table/TablePagination';
import { useClientTablePagination } from '@/hooks/useClientTablePagination';
import { useRouter } from '@/i18n/navigation';

const globalFilterFn: FilterFn<Volume> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, driver, mountpoint } = row.original;

    const size = formatBytes(row.original.usageData?.Size || 0);

    return (
        name.toLowerCase().includes(search) ||
        driver.toLowerCase().includes(search) ||
        mountpoint.toLowerCase().includes(search) ||
        size.toLowerCase().includes(search)
    );
};

export function TableDockerVolumes() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});

    const t = useTranslations('docker.tables');
    const tCommon = useTranslations('common');

    const router = useRouter();

    const statusDocker = useDockerStore((state) => state.status);

    const volumes = useVolumesStore((state) => state.volumes);
    const lastUpdate = useVolumesStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const isLoading = !volumes.length && !lastUpdate;
    const isEmpty = !volumes.length && !!lastUpdate;

    const pagination = useClientTablePagination();

    const table = useReactTable({
        data: volumes,
        columns: getColumnsTableVolumes(t),
        getRowId: (originalRow: Volume) => originalRow.name,
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

    const handleDeleteAction = () => {
        const volumeNames = Object.keys(rowSelection);
        openAlertDialog({
            title: t('deleteVolumes'),
            description: t('confirmDeleteVolumes', { count: volumeNames.length }),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            onAction: async () => {
                const result = await onVolumeAction({ volumeNames, action: 'delete' });
                if (!result?.serverError) {
                    table.resetRowSelection();
                }
            },
        });
    };

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex flex-wrap justify-between gap-3'}>
                <Input
                    className={'w-56 shadow-xs'}
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
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
                emptyLabel={t('noVolumesFound')}
                hasActiveFilters={!isEmpty}
                onRowClick={(volume) => router.push(`/docker/volumes/${encodeURIComponent(volume.name)}`)}
            />

            <TablePagination
                table={table}
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.setPageSize}
                perPageLabel={t('volumesPerPage')}
                allowAllPageSize
            />
        </div>
    );
}
