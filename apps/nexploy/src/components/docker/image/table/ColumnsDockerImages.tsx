'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { ImageDropdownActions } from '@/components/docker/image/ImageDropdownActions';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { ImageRow } from '@workspace/typescript-interface/docker/docker.image';
import Link from 'next/link';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';

export const getColumnsTableImages = (t: TranslationFunction): ColumnDef<ImageRow>[] => [
    {
        id: 'select',
        size: 28,
        header: ({ table }) => {
            const allRows = table.getRowModel().flatRows;
            const selectableRows = allRows.filter((row) => !row.original.isGroup);
            const allSelected =
                selectableRows.length > 0 && selectableRows.every((row) => row.getIsSelected());
            const someSelected = selectableRows.some((row) => row.getIsSelected());

            return (
                <Checkbox
                    checked={allSelected || (someSelected && 'indeterminate')}
                    onCheckedChange={(value) => {
                        selectableRows.forEach((row) => row.toggleSelected(!!value));
                    }}
                    aria-label="Select all"
                />
            );
        },
        cell: ({ row }) => {
            const isGroup = row.original.isGroup;
            if (isGroup) {
                const isAllSelected = row.getIsAllSubRowsSelected();
                const isSomeSelected = row.getIsSomeSelected() && !isAllSelected;
                return (
                    <Checkbox
                        checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                        onCheckedChange={(value) => {
                            row.subRows.forEach((subRow) => subRow.toggleSelected(!!value));
                        }}
                        aria-label="Select group"
                    />
                );
            }
            return (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('repository')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const isGroup = row.original.isGroup;
            const nameTags = row.original.name;
            const containersUsed = row.original.containersUsed;
            const nameJoin = nameTags.join(' → ');
            const depth = row.depth;

            if (isGroup) {
                return (
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0"
                            onClick={() => row.toggleExpanded()}
                        >
                            <ChevronRight
                                className={cn(
                                    'size-4 transition-transform duration-200',
                                    row.getIsExpanded() && 'rotate-90',
                                )}
                            />
                        </Button>
                        <Status
                            className="max-w-full justify-start border-0 text-sm"
                            status={containersUsed ? 'online' : 'offline'}
                            variant="outline"
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <StatusIndicator />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {containersUsed ? (
                                        <p>{t('imageUsed')}</p>
                                    ) : (
                                        <p>{t('imageUnused')}</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                            <StatusLabel className="min-w-0 truncate text-current hover:underline">
                                {nameJoin}
                            </StatusLabel>
                        </Status>
                    </div>
                );
            }

            return (
                <Link
                    href={`/docker/images/${row.original.id}`}
                    className="flex items-start gap-2 hover:opacity-80"
                    style={{ paddingLeft: depth > 0 ? `${depth * 24 + 8}px` : undefined }}
                >
                    <Status
                        className="max-w-full justify-start border-0 text-sm"
                        status={containersUsed ? 'online' : 'offline'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>
                                {containersUsed ? (
                                    <p>{t('imageUsed')}</p>
                                ) : (
                                    <p>{t('imageUnused')}</p>
                                )}
                            </TooltipContent>
                        </Tooltip>

                        <StatusLabel className="min-w-0 truncate text-current hover:underline">
                            {nameJoin}
                        </StatusLabel>
                    </Status>
                </Link>
            );
        },
    },
    {
        accessorKey: 'tag',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('version')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const isGroup = row.original.isGroup;
            if (isGroup) {
                const tags = row.original.tag || [];
                return (
                    <Badge variant="outline" className="max-w-full justify-start text-xs">
                        <span className={'truncate'}>
                            {tags.length} {t('versions')}
                        </span>
                    </Badge>
                );
            }
            const tag = row.original.tag;
            return (
                <Badge variant="secondary" className="max-w-full justify-start font-mono text-xs">
                    <span className={'truncate'}>{tag.join(' → ')}</span>
                </Badge>
            );
        },
    },
    {
        accessorKey: 'id',
        header: t('imageId'),
        cell: ({ row }) => {
            const isGroup = row.original.isGroup;
            if (isGroup) {
                return <span className="text-muted-foreground text-sm">—</span>;
            }

            return (
                <Badge variant={'secondary'} className={'max-w-full justify-start'}>
                    <span className={'truncate'}>{row.original.id}</span>
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('created')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const created = row.original.created;
            const date = dayjs(created).format('DD/MM/YYYY');

            return <div className="text-muted-foreground truncate">{date}</div>;
        },
    },
    {
        accessorKey: 'size',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('size')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const size = row.original.size;
            return <div className="truncate text-sm">{formatBytes(size)}</div>;
        },
    },
    {
        id: 'actions',
        size: 50,
        cell: ({ row }) => {
            const isGroup = row.original.isGroup;
            if (isGroup) {
                return null;
            }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={'size-8'}>
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <ImageDropdownActions image={row.original} />
                </DropdownMenu>
            );
        },
    },
];
