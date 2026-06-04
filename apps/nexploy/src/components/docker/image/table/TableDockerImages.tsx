'use client';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import {
    ExpandedState,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@workspace/ui/components/table';
import React, { useMemo, useRef, useState } from 'react';
import { getColumnsTableImages } from '@/components/docker/image/table/ColumnsDockerImages';
import { useTranslations } from 'next-intl';
import { useImagesStore } from '@/stores/docker/useImagesStore.ts';
import { ImageRow } from '@workspace/typescript-interface/docker/docker.image';
import { groupImagesByRepository, matchesSearch } from './imageTableUtils';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Play, Trash2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useRouter } from '@/i18n/navigation';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label.tsx';
import { cn } from '@workspace/ui/lib/utils.ts';

const globalFilterFn: FilterFn<ImageRow> = (row, _, value) => {
    const search = value.toLowerCase();
    const { isGroup, groupName, subRows } = row.original;

    if (isGroup && groupName) {
        if (groupName.toLowerCase().includes(search)) return true;
        return !!subRows?.some((img) => matchesSearch(img, search));
    }

    return matchesSearch(row.original, search);
};

export function TableDockerImages() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);

    const router = useRouter();
    const t = useTranslations('docker.tables');
    const tCommon = useTranslations('common');

    const images = useImagesStore((state) => state.images);
    const lastUpdate = useImagesStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const forceRef = useRef(false);

    const groupedImages = useMemo(() => groupImagesByRepository(images), [images]);
    const isLoading = !images.length && !lastUpdate;
    const isEmpty = !images.length && !!lastUpdate;

    const table = useReactTable({
        data: groupedImages,
        columns: getColumnsTableImages(t),
        getRowId: (originalRow: ImageRow) => originalRow.id,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onRowSelectionChange: setRowSelection,
        onExpandedChange: setExpanded,
        getSubRows: (row) => row.subRows,
        initialState: {
            pagination: {
                pageSize: pageSize === 'all' ? images.length : pageSize,
            },
        },
        state: {
            sorting,
            globalFilter,
            rowSelection,
            expanded,
        },
    });

    const selectedRows = table.getSelectedRowModel().rows;
    const selectedRow = selectedRows[0];
    const selectedImage = selectedRow?.original;

    const numberOfSelectedRows = Object.keys(rowSelection).length;

    const handleDeleteAction = () => {
        const imageIds = Object.keys(rowSelection);
        forceRef.current = false;
        openAlertDialog({
            title: t('removeImages'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            description: (
                <div className={'space-y-4'}>
                    <p>{t('confirmRemoveImages', { count: imageIds.length })}</p>
                    <Label
                        htmlFor={'force-delete-images'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>
                                {t('forceDelete')}
                            </p>
                            <p className={'text-xs'}>{t('forceDeleteDescription')}</p>
                        </div>
                        <Switch
                            id="force-delete-images"
                            defaultChecked={false}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </Label>
                </div>
            ),
            onAction: async () => {
                await onImageAction({ imageIds, action: 'delete', force: forceRef.current });
                table.resetRowSelection();
            },
        });
    };

    const handleUseAction = () => {
        router.push(`/docker/containers/create?image=${selectedImage?.repoTags[0]}`);
    };

    const isShowingAll = pageSize === 'all';
    const isUseDisabled = numberOfSelectedRows !== 1 || !selectedImage?.repoTags.length;

    const getUseTooltipContent = () => {
        if (numberOfSelectedRows === 0) {
            return t('selectImageToUse');
        }
        if (numberOfSelectedRows > 1) {
            return t('selectOnlyOneImage');
        }
        if (!selectedImage?.repoTags.length) {
            return t('noRepositoryTags');
        }
        return;
    };

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex justify-between'}>
                <Input
                    className={'w-1/5 shadow-xs'}
                    placeholder={tCommon('searchPlaceholder')}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button onClick={handleUseAction} disabled={isUseDisabled}>
                                    <Play />
                                    {t('use')}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {getUseTooltipContent() && (
                            <TooltipContent>{getUseTooltipContent()}</TooltipContent>
                        )}
                    </Tooltip>
                    <Button
                        variant={'destructive'}
                        onClick={handleDeleteAction}
                        disabled={numberOfSelectedRows === 0}
                    >
                        <Trash2 />
                        {tCommon('remove')}
                        {numberOfSelectedRows > 1 && (
                            <Badge variant={'secondary'} className={'rounded-full'}>
                                {numberOfSelectedRows}
                            </Badge>
                        )}
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
                                    {t('noImagesFound')}
                                </TableCell>
                            </TableRow>
                        ) : !isLoading && table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    {t('noImagesMatchSearch')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn('h-12', row.original.isGroup && 'bg-muted/30')}
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
                    <span className="text-muted-foreground text-sm">{t('imagesPerPage')}:</span>
                    <Select
                        value={pageSize === 'all' ? 'all' : String(pageSize)}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setPageSize('all');
                                table.setPageSize(images.length);
                            } else {
                                const size = Number(value);
                                setPageSize(size);
                                table.setPageSize(size);
                            }
                        }}
                    >
                        <SelectTrigger size={'sm'} className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{tCommon('size')}</SelectLabel>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                                <SelectItem value="all">{tCommon('all')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {!isShowingAll && (
                    <div className={'flex items-center gap-2'}>
                        <span className="text-muted-foreground text-sm">
                            {tCommon('pageOf', {
                                current: table.getState().pagination.pageIndex + 1,
                                total: table.getPageCount(),
                            })}
                        </span>
                        <div className={'flex gap-1'}>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className={'h-4 w-4'} />
                                {tCommon('previous')}
                            </Button>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                {tCommon('next')}
                                <ChevronRight className={'h-4 w-4'} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
