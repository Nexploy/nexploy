'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import CopyButton from '@/components/utils/CopyButton';
import dayjs from 'dayjs';
import { NetworkDropdownActions } from '@/components/docker/network/NetworkDropdownActions';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

type TranslationFunction = (key: string) => string;

export const getColumnsTableNetworks = (t: TranslationFunction): ColumnDef<Network>[] => [
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
            const isBuiltin = ['bridge', 'host', 'none'].includes(name);

            return (
                <div className="flex items-start gap-2">
                    <Status
                        className={'max-w-60 truncate border-0 text-sm'}
                        status={isBuiltin ? 'maintenance' : 'online'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>
                                {isBuiltin ? <p>{t('systemNetwork')}</p> : <p>{t('customNetwork')}</p>}
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
        accessorKey: 'scope',
        header: t('scope'),
        cell: ({ row }) => {
            const scope = row.original.scope;
            return <Badge variant="outline">{scope}</Badge>;
        },
    },
    {
        accessorKey: 'id',
        header: t('networkId'),
        cell: ({ row }) => {
            const networkId = row.original.id;
            return (
                <div className="flex max-w-50 items-center gap-2">
                    <code className="text-muted-foreground truncate text-sm">{networkId}</code>
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
        accessorKey: 'containers',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('containers')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const containers = row.original.containers;

            const count = containers?.length || 0;
            return (
                <div className="flex items-center gap-2">
                    <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}</Badge>
                </div>
            );
        },
        sortingFn: (rowA, rowB) => {
            const lengthA = rowA.original.containers?.length || 0;
            const lengthB = rowB.original.containers?.length || 0;
            return lengthA - lengthB;
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
            const date = dayjs.unix(created).format('DD/MM/YYYY');

            return (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">{date}</div>
            );
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
                <NetworkDropdownActions network={row.original} />
            </DropdownMenu>
        ),
    },
];
