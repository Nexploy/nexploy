'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Crown } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import type {
    SwarmNode,
    SwarmNodeAvailability,
    SwarmNodeState,
} from '@workspace/typescript-interface/docker/swarm';
import { NodeActions } from './NodeActions';

type TranslationFunction = (key: string) => string;

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
                <div className="flex items-center gap-2 font-medium">
                    {managerStatus?.leader && <Crown className="size-4 text-yellow-500" />}
                    {hostname}
                </div>
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
            <Badge variant={getStateBadgeVariant(row.original.state)}>{row.original.state}</Badge>
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
            <span className="text-muted-foreground text-sm">{row.original.address || '-'}</span>
        ),
    },
    {
        accessorKey: 'engineVersion',
        header: t('engine'),
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {row.original.engineVersion || '-'}
            </span>
        ),
    },
    {
        id: 'resources',
        header: t('resources'),
        cell: ({ row }) => {
            const { nanoCPUs, memoryBytes } = row.original.resources;
            return (
                <span className="text-muted-foreground text-sm">
                    {formatCPUs(nanoCPUs)} CPUs / {formatBytes(memoryBytes)}
                </span>
            );
        },
    },
    {
        id: 'labels',
        header: t('labels'),
        cell: ({ row }) => {
            const entries = Object.entries(row.original.labels || {});
            return (
                <div className="flex flex-wrap gap-1">
                    {entries.slice(0, 2).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                            {key}={value}
                        </Badge>
                    ))}
                    {entries.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                            +{entries.length - 2}
                        </Badge>
                    )}
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => <NodeActions node={row.original} />,
    },
];
