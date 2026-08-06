'use client';

import type { MouseEvent, ReactNode } from 'react';
import { flexRender, type Row, type Table as TanstackTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { cn } from '@workspace/ui/lib/utils';

export interface TableShellProps<TData> {
    table: TanstackTable<TData>;
    emptyLabel: ReactNode;
    noResultsLabel?: ReactNode;
    hasActiveFilters?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
    skeletonRows?: number;
    bare?: boolean;
    className?: string;
    rowClassName?: string | ((row: Row<TData>) => string | undefined);
    onRowClick?: (data: TData, row: Row<TData>) => void;
    isRowClickable?: (row: TData) => boolean;
}

const INTERACTIVE_SELECTOR =
    'a, button, input, label, select, textarea, [role="checkbox"], [role="menu"], [role="menuitem"], [role="dialog"], [data-slot="checkbox"]';

export function TableShell<TData>({
    table,
    emptyLabel,
    noResultsLabel,
    hasActiveFilters = false,
    isLoading = false,
    isFetching = false,
    skeletonRows = 10,
    bare = false,
    className,
    rowClassName = 'h-12',
    onRowClick,
    isRowClickable,
}: TableShellProps<TData>) {
    const columns = table.getAllColumns();
    const rows = table.getRowModel().rows;

    const handleRowClick = (row: Row<TData>) => (event: MouseEvent<HTMLTableRowElement>) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest(INTERACTIVE_SELECTOR)) return;
        onRowClick?.(row.original, row);
    };

    const content = (
        <Table className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead
                                key={header.id}
                                style={
                                    header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined
                                }
                            >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {isLoading &&
                    Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                        <TableRow key={rowIndex} className="h-12">
                            {columns.map((column) => (
                                <TableCell key={column.id}>
                                    <Skeleton className="h-6 w-full" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}

                {!isLoading && rows.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="py-6 text-center">
                            <span className="text-muted-foreground text-sm">
                                {hasActiveFilters && noResultsLabel ? noResultsLabel : emptyLabel}
                            </span>
                        </TableCell>
                    </TableRow>
                )}

                {!isLoading &&
                    rows.map((row) => {
                        const clickable = Boolean(onRowClick) && (isRowClickable?.(row.original) ?? true);

                        return (
                            <TableRow
                                key={row.id}
                                className={cn(
                                    typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
                                    clickable && 'cursor-pointer',
                                )}
                                data-state={row.getIsSelected() && 'selected'}
                                onClick={clickable ? handleRowClick(row) : undefined}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
            </TableBody>
        </Table>
    );

    if (bare) return content;

    return <div className={cn('bg-card overflow-hidden rounded-md border shadow-sm', className)}>{content}</div>;
}
