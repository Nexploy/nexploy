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
import { columnsTableImages } from '@/components/docker/image/table/ColumnsDockerImages';
import { useImageStore } from '@/stores/docker/useImageStore';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, Play, Plus, Trash } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import { Badge } from '@workspace/ui/components/badge';
import Link from 'next/link';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useRouter } from '@/i18n/navigation';

const globalFilterFn: FilterFn<Image> = (row, _, value) => {
    const search = value.toLowerCase();
    const { name, tag, id, size, created, containersUsed } = row.original;

    const realSize = formatBytes(size);
    const date = new Date(created * 1000).toLocaleDateString();

    if (
        name?.some((n) => n.toLowerCase().includes(search)) ||
        tag?.some((t) => t.toLowerCase().includes(search)) ||
        id.toLowerCase().includes(search) ||
        date.toLowerCase().includes(search) ||
        realSize.toLowerCase().includes(search)
    ) {
        return true;
    }

    return false;
};

export function TableDockerImages() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState<number | 'all'>(10);

    const router = useRouter();

    const images = useImageStore((state) => state.images);
    const lastUpdate = useImageStore((state) => state.lastUpdate);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const isLoading = !images.length && !lastUpdate;
    const isEmpty = !images.length && !!lastUpdate;

    const table = useReactTable({
        data: images,
        columns: columnsTableImages,
        getRowId: (originalRow: Image) => originalRow.id,
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
    const selectedImage = selectedRow?.original;

    const numberOfSelectedRows = Object.keys(rowSelection).length;

    const handleDeleteAction = () => {
        const imageIds = Object.keys(rowSelection);
        openAlertDialog({
            title: 'Remove Images',
            description: `Are you sure you want to remove ${imageIds.length} image?`,
            cancelLabel: 'Cancel',
            actionLabel: 'Remove',
            onAction: async () => {
                await onImageAction({ imageIds, action: 'delete' });
                table.resetRowSelection();
            },
        });
    };

    const handleUseAction = () => {
        router.push(`/docker/containers/add-container?image=${selectedImage?.repoTags[0]}`);
    };

    const isShowingAll = pageSize === 'all';
    const isUseDisabled = numberOfSelectedRows !== 1 || !selectedImage?.repoTags.length;

    const getUseTooltipContent = () => {
        if (numberOfSelectedRows === 0) {
            return 'Please select an image to use';
        }
        if (numberOfSelectedRows > 1) {
            return 'Please select only one image';
        }
        if (!selectedImage?.repoTags.length) {
            return 'This image has no repository tags';
        }
        return;
    };

    return (
        <div className={'mx-5 space-y-3'}>
            <div className={'flex justify-between'}>
                <Input
                    className={'w-1/5 shadow-xs'}
                    placeholder="Search..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
                    <Button
                        variant={'destructive'}
                        onClick={handleDeleteAction}
                        disabled={!numberOfSelectedRows}
                    >
                        <Trash />
                        Remove{' '}
                        {!!numberOfSelectedRows && (
                            <Badge variant={'secondary'} className={'rounded-full'}>
                                {numberOfSelectedRows}
                            </Badge>
                        )}
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button onClick={handleUseAction} disabled={isUseDisabled}>
                                        <Play />
                                        Use
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {getUseTooltipContent() && (
                                <TooltipContent>
                                    <p>{getUseTooltipContent()}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <Button asChild>
                        <Link href={'/docker/images/add-image'}>
                            <Plus />
                            Pull Image
                        </Link>
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
                                    No images found.
                                </TableCell>
                            </TableRow>
                        ) : !isLoading && table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="py-6 text-center"
                                >
                                    No images match your search.
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
                    <span className="text-muted-foreground text-sm">Images per page:</span>
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
                            <SelectValue placeholder="Images per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Size</SelectLabel>
                                {[10, 25, 50, 100].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                                <SelectItem value="all">All</SelectItem>
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
                                Previous
                            </Button>
                            <Button
                                variant={'outline'}
                                size={'sm'}
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                                <ChevronRight className={'h-4 w-4'} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
