'use client';

import {
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import React, { useState } from 'react';
import { columnsTableVolumes } from '@/components/docker/volume/table/ColumnsDockerVolumes';
import { useVolumeStore } from '@/stores/docker/useVolumeStore';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Plus, Trash } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useSheetStore } from '@/stores/useSheetStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

const globalFilterFn: FilterFn<Volume> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, driver, mountpoint } = row.original;

    const size = formatBytes(row.original.usageData?.Size || 0);

    if (
        name.toLowerCase().includes(search) ||
        driver.toLowerCase().includes(search) ||
        mountpoint.toLowerCase().includes(search) ||
        size.toLowerCase().includes(search)
    ) {
        return true;
    }

    return false;
};

export function TableDockerVolumes() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    const volumes = useVolumeStore((state) => state.volumes);
    const lastUpdate = useVolumeStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const openSheet = useSheetStore((state) => state.openSheet);

    const isLoading = !volumes.length && !lastUpdate;
    const isEmpty = !volumes.length && !!lastUpdate;

    const table = useReactTable({
        data: volumes,
        columns: columnsTableVolumes,
        getRowId: (originalRow: Volume) => originalRow.name,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const selectedRows = table.getSelectedRowModel().rows;
    const selectedRow = selectedRows[0];
    const selectedVolume = selectedRow?.original;

    const volumeUsed = selectedVolume?.usageData?.RefCount;

    const numberOfSelectedRows = Object.keys(rowSelection).length;

    const handleDeleteAction = () => {
        const volumeNames = Object.keys(rowSelection);
        openAlertDialog({
            title: 'Supprimer les volumes',
            description: `Êtes-vous sûr de vouloir supprimer ${volumeNames.length} volume(s) ?`,
            cancelLabel: 'Annuler',
            actionLabel: 'Supprimer',
            onAction: async () => {
                await onVolumeAction({ volumeNames, action: 'remove' });
                table.resetRowSelection();
            },
        });
    };

    const handleAddVolume = () => {
        openSheet({
            title: 'Créer un volume',
            content: 'ADD_VOLUME',
        });
    };

    const isShowingAll = pageSize === 'all';

    const isUseDisabled = numberOfSelectedRows !== 1 || volumeUsed;

    const getUseTooltipContent = () => {
        if (numberOfSelectedRows === 0) {
            return 'Please select volumes to delete';
        }
        if (volumeUsed) {
            return 'Déconnectez tous les conteneurs utilisant ce volume d’abord';
        }
        return;
    };

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex justify-between'}>
                <Input
                    className={'w-1/5 shadow-xs'}
                    placeholder="Rechercher..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    variant={'destructive'}
                                    onClick={handleDeleteAction}
                                    disabled={!!isUseDisabled}
                                >
                                    <Trash />
                                    Supprimer{' '}
                                    {!!numberOfSelectedRows && (
                                        <Badge variant={'secondary'} className={'rounded-full'}>
                                            {numberOfSelectedRows}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {getUseTooltipContent() && (
                            <TooltipContent>
                                <p>{getUseTooltipContent()}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                    <Button onClick={handleAddVolume}>
                        <Plus />
                        Créer un volume
                    </Button>
                </div>
            </div>
            <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                            Array.from({ length: 5 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-12">
                                    {table.getAllColumns().map((column) => (
                                        <TableCell key={column.id}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {!isLoading && isEmpty ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    Aucun volume trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={'h-12'}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className={'flex items-center justify-between'}>
                <div className={'flex items-center gap-2'}>
                    <span className="text-muted-foreground text-sm">Volumes par page:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(table.getRowModel().rows.length);
                            } else {
                                const size = Number(value);
                                setPageSize(size);
                                table.setPageSize(size);
                            }
                        }}
                    >
                        <SelectTrigger size={'sm'} className="w-24">
                            <SelectValue placeholder="Volumes par page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Taille</SelectLabel>
                                {[10, 25, 50, 100].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                                <SelectItem value="all">Tout</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {!isShowingAll && (
                    <div className={'flex items-center gap-2'}>
                        <span className="text-muted-foreground text-sm">
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </span>
                        <div className={'flex gap-1'}>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className={'h-4 w-4'} />
                                Précédent
                            </Button>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Suivant
                                <ChevronRight className={'h-4 w-4'} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
