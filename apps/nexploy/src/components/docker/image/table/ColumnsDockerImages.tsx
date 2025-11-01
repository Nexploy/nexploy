'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import CopyButton from '@/components/utils/CopyButton';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { ImageDropdownActions } from '@/components/docker/image/ImageDropdownActions';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

export const columnsTableImages: ColumnDef<Image>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
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
                Repository
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const nameTags = row.original.name;
            const containersUsed = row.original.containersUsed;
            const nameJoin = nameTags?.join(', ') || '<none>';

            return (
                <div className="flex items-start gap-2">
                    <Status
                        className={'max-w-60 truncate border-0 text-sm'}
                        status={containersUsed ? 'online' : 'offline'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>
                                {containersUsed ? <p>Image Used</p> : <p>Image Unused</p>}
                            </TooltipContent>
                        </Tooltip>

                        <StatusLabel className="truncate font-medium text-current">
                            {nameJoin}
                        </StatusLabel>
                    </Status>
                </div>
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
                Version
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const tag = row.original.tag;
            return (
                <Badge variant="secondary" className="font-mono">
                    {tag.length ? tag : '<none>'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'id',
        header: 'Image ID',
        cell: ({ row }) => {
            const imageId = row.original.id;
            return (
                <div className="flex max-w-60 items-center gap-2">
                    <code className="text-muted-foreground truncate text-sm">{imageId}</code>
                    <CopyButton
                        textToCopy={row.original.id}
                        className="size-7 !text-xs"
                        size={'icon'}
                        variant={'ghost'}
                    />
                </div>
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
                Créé
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const created = row.original.created;
            const date = dayjs.unix(created).format('DD/MM/YYYY');

            return (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">{date}</div>
            );
        },
    },
    {
        accessorKey: 'size',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Taille
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const size = row.original.size;
            return <div className="flex items-center gap-2 text-sm">{formatBytes(size)}</div>;
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <ImageDropdownActions image={row.original} />
            </DropdownMenu>
        ),
    },
];
