'use client';

import type { ReactNode } from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { PAGE_SIZE_ALL, type PageSize } from '@workspace/typescript-interface/table';
import { cn } from '@workspace/ui/lib/utils';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';

export interface TablePaginationProps<TData> {
    table: TanstackTable<TData>;
    pageSize: PageSize;
    onPageSizeChange: (pageSize: PageSize) => void;
    perPageLabel: string;
    allowAllPageSize?: boolean;
    totalLabel?: ReactNode;
    className?: string;
}

export function TablePagination<TData>({
    table,
    pageSize,
    onPageSizeChange,
    perPageLabel,
    allowAllPageSize = false,
    totalLabel,
    className,
}: TablePaginationProps<TData>) {
    const tCommon = useTranslations('common');

    const isShowingAll = pageSize === PAGE_SIZE_ALL;

    return (
        <div className={cn('flex items-center justify-between', className)}>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{perPageLabel}:</span>
                <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => onPageSizeChange(value === PAGE_SIZE_ALL ? PAGE_SIZE_ALL : Number(value))}
                >
                    <SelectTrigger size="sm" className="min-w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectGroup>
                            <SelectLabel>{tCommon('size')}</SelectLabel>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                            {allowAllPageSize && <SelectItem value={PAGE_SIZE_ALL}>{tCommon('all')}</SelectItem>}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {totalLabel && <span className="text-muted-foreground text-sm">{totalLabel}</span>}
            </div>

            {!isShowingAll && (
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                        {tCommon('pageOf', {
                            current: table.getState().pagination.pageIndex + 1,
                            total: Math.max(1, table.getPageCount()),
                        })}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {tCommon('previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {tCommon('next')}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
