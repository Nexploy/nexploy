'use client';

import {
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
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
import { useImageStore } from '@/stores/useImageStore';
import { Image } from '@workspace/typescript-interface/docker.image';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';
import { Badge } from '@workspace/ui/components/badge';
import Link from 'next/link';

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

    if ('unused'.toLowerCase().includes(search) && !containersUsed) return true;

    return false;
};

export function TableDockerImages() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState({});

    const images = useImageStore((state) => state.images);

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
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
    });

    const numberOfSelectedRows = Object.keys(rowSelection).length;

    return (
        <div className={'mx-6 space-y-3'}>
            <div className={'flex justify-between'}>
                <Input
                    className={'w-1/5 shadow-xs'}
                    placeholder="Search..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <div className={'flex gap-3'}>
                    <Button variant={'destructive'} disabled={!numberOfSelectedRows}>
                        <Trash />
                        Remove{' '}
                        {!!numberOfSelectedRows && (
                            <Badge variant={'secondary'} className={'rounded-full'}>
                                {numberOfSelectedRows}
                            </Badge>
                        )}
                    </Button>
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
                        {table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={'h-12'}
                                data-state={row.getIsSelected() && 'selected'}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
