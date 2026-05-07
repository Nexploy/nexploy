'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import dayjs from 'dayjs';
import { NetworkDropdownActions } from '@/components/docker/network/NetworkDropdownActions';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import Link from 'next/link';
import { isBuiltinNetwork } from '@workspace/shared/nexployFilter';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';

export const getColumnsTableNetworks = (t: TranslationFunction): ColumnDef<Network>[] => [
    {
        id: 'select',
        size: 28,
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
        sortingFn: (rowA, rowB) => {
            const aBuiltin = isBuiltinNetwork(rowA.original.name) ? 0 : 1;
            const bBuiltin = isBuiltinNetwork(rowB.original.name) ? 0 : 1;
            if (aBuiltin !== bBuiltin) return aBuiltin - bBuiltin;
            return rowA.original.name.localeCompare(rowB.original.name);
        },
        cell: ({ row }) => {
            const name = row.original.name;
            const isBuiltin = isBuiltinNetwork(name);

            return (
                <Link
                    href={`/docker/networks/${row.original.id}`}
                    className="flex items-start gap-2"
                >
                    <Status
                        className="max-w-full justify-start border-0 text-sm"
                        status={isBuiltin ? 'maintenance' : 'online'}
                        variant="outline"
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusIndicator />
                            </TooltipTrigger>
                            <TooltipContent>
                                {isBuiltin ? (
                                    <p>{t('systemNetwork')}</p>
                                ) : (
                                    <p>{t('customNetwork')}</p>
                                )}
                            </TooltipContent>
                        </Tooltip>

                        <StatusLabel className="min-w-0 truncate text-current hover:underline">
                            {name}
                        </StatusLabel>
                    </Status>
                </Link>
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
                <Badge variant="secondary" className="max-w-full justify-start truncate text-xs">
                    <span className={'truncate'}>{driver}</span>
                </Badge>
            );
        },
    },
    {
        accessorKey: 'scope',
        header: t('scope'),
        cell: ({ row }) => {
            const scope = row.original.scope;

            return (
                <Badge variant="outline" className="max-w-full justify-start truncate text-xs">
                    <span className={'truncate'}>{scope}</span>
                </Badge>
            );
        },
    },
    {
        accessorKey: 'id',
        header: t('networkId'),
        cell: ({ row }) => {
            const networkId = row.original.id;
            return (
                <div className="flex">
                    <code className="text-muted-foreground truncate">{networkId}</code>
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
                <Badge
                    className="max-w-full justify-start truncate text-xs"
                    variant={count > 0 ? 'default' : 'secondary'}
                >
                    <span className={'truncate'}>{count}</span>
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
            const date = dayjs.unix(created).format('DD/MM/YYYY');

            return <div className="text-muted-foreground truncate">{date}</div>;
        },
    },
    {
        id: 'actions',
        size: 50,
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={'size-8'}>
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <NetworkDropdownActions network={row.original} />
            </DropdownMenu>
        ),
    },
];
