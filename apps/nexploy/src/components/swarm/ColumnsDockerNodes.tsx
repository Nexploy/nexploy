'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Crown, MoreHorizontal } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import type {
    SwarmNode,
    SwarmNodeAvailability,
    SwarmNodeState,
} from '@workspace/typescript-interface/docker/swarm';
import { NodeDropdownActions } from './NodeDropdownActions';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import Link from 'next/link';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCPUs(nanoCPUs: number): string {
    return (nanoCPUs / 1e9).toFixed(2);
}

function getStateBadgeVariant(
    state: SwarmNodeState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (state) {
        case 'ready':
            return 'default';
        case 'down':
        case 'disconnected':
            return 'destructive';
        default:
            return 'secondary';
    }
}

function getAvailabilityBadgeVariant(
    availability: SwarmNodeAvailability,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (availability) {
        case 'active':
            return 'default';
        case 'pause':
            return 'secondary';
        case 'drain':
            return 'outline';
        default:
            return 'secondary';
    }
}

export const getColumnsTableNodes = (t: TranslationFunction): ColumnDef<SwarmNode>[] => [
    {
        accessorKey: 'hostname',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('hostname')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const { hostname, managerStatus } = row.original;
            return (
                <Link
                    href={`/swarm/nodes/${row.original.id}`}
                    className="flex items-center gap-1.5 hover:underline"
                >
                    {managerStatus?.leader && <Crown className="size-4 text-yellow-500" />}
                    <span>{hostname}</span>
                </Link>
            );
        },
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('role')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant={row.original.role === 'manager' ? 'default' : 'secondary'}>
                {row.original.role}
            </Badge>
        ),
    },
    {
        accessorKey: 'state',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('status')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant={getStateBadgeVariant(row.original.state)}>
                {row.original.state}
            </Badge>
        ),
    },
    {
        accessorKey: 'availability',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('availability')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant={getAvailabilityBadgeVariant(row.original.availability)}>
                {row.original.availability}
            </Badge>
        ),
    },
    {
        accessorKey: 'address',
        header: t('address'),
        cell: ({ row }) => (
            <div className="text-muted-foreground">{row.original.address || '—'}</div>
        ),
    },
    {
        accessorKey: 'engineVersion',
        header: t('engine'),
        cell: ({ row }) => (
            <div className="text-muted-foreground">{row.original.engineVersion || '—'}</div>
        ),
    },
    {
        id: 'resources',
        header: t('resources'),
        cell: ({ row }) => {
            const { nanoCPUs, memoryBytes } = row.original.resources;
            return (
                <div className="text-muted-foreground">
                    {formatCPUs(nanoCPUs)} CPUs / {formatBytes(memoryBytes)}
                </div>
            );
        },
    },
    {
        id: 'actions',
        size: 50,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <NodeDropdownActions node={row.original} />
                </DropdownMenu>
            </div>
        ),
    },
];
