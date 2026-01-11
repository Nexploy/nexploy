'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import CopyButton from '@/components/utils/CopyButton';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';
import { VolumeDropdownActions } from '@/components/docker/volume/VolumeDropdownActions';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

type TranslationFunction = (key: string) => string;

export const getColumnsTableVolumes = (t: TranslationFunction): ColumnDef<Volume>[] => [
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
                {t('name')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const name = row.original.name;
            const usageData = row.original.usageData;

            const volumeUsed = usageData?.RefCount;

            return (
                <div className="flex items-start gap-2">
                    <Status
                        className={'max-w-60 truncate border-0 text-sm'}
                        status={volumeUsed ? 'online' : 'offline'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>
                                {volumeUsed ? <p>{t('volumeUsed')}</p> : <p>{t('volumeUnused')}</p>}
                            </TooltipContent>
                        </Tooltip>

                        <StatusLabel className="truncate font-medium text-current">
                            {name}
                        </StatusLabel>
                    </Status>
                </div>
            );
        },
    },
    {
        accessorKey: 'driver',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('driver')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const driver = row.original.driver;
            return (
                <Badge variant="secondary" className="font-mono">
                    {driver}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'mountpoint',
        header: t('mountpoint'),
        cell: ({ row }) => {
            const mountpoint = row.original.mountpoint;
            return (
                <div className="flex w-60 items-center gap-2">
                    <code className="text-muted-foreground truncate text-sm">{mountpoint}</code>
                    <CopyButton
                        textToCopy={mountpoint}
                        className="size-7 !text-xs"
                        size={'icon'}
                        variant={'ghost'}
                    />
                </div>
            );
        },
    },
    {
        accessorKey: 'createdAt',
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
            const createdAt = row.original.createdAt;
            const date = dayjs(createdAt).format('DD/MM/YYYY HH:mm');

            return (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">{date}</div>
            );
        },
    },
    {
        accessorKey: 'usageData',
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
            const usageData = row.original.usageData;
            const size = usageData?.Size || 0;
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
                <VolumeDropdownActions volume={row.original} />
            </DropdownMenu>
        ),
    },
];
