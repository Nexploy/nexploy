'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import dayjs from 'dayjs';
import { TraefikRequest } from '@workspace/typescript-interface/traefik/traefik.request';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import { formatBytes } from '@/utils/formatBytes.ts';

const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'default';
        case 'POST':
            return 'secondary';
        case 'PUT':
        case 'PATCH':
            return 'outline';
        case 'DELETE':
            return 'destructive';
        default:
            return 'secondary';
    }
};

const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'secondary';
    if (status >= 400 && status < 500) return 'outline';
    if (status >= 500) return 'destructive';
    return 'secondary';
};

const formatDuration = (ms: number) => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

export const getColumnsTableRequests = (t: TranslationFunction): ColumnDef<TraefikRequest>[] => [
    {
        accessorKey: 'timestamp',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('table.timestamp')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="text-muted-foreground text-xs">
                {dayjs(row.original.timestamp).format('DD/MM HH:mm:ss')}
            </div>
        ),
    },
    {
        accessorKey: 'method',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('table.method')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant={getMethodColor(row.original.method)} className="font-mono text-xs">
                {row.original.method}
            </Badge>
        ),
    },
    {
        accessorKey: 'path',
        header: t('table.path'),
        cell: ({ row }) => (
            <div className="max-w-80 truncate font-mono text-sm" title={row.original.path}>
                {row.original.path}
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('table.status')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge variant={getStatusColor(row.original.status)} className="font-mono">
                {row.original.status}
            </Badge>
        ),
    },
    {
        accessorKey: 'duration',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('table.duration')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="text-muted-foreground font-mono text-sm">
                {formatDuration(row.original.duration)}
            </div>
        ),
    },
    {
        accessorKey: 'size',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {t('table.size')}
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="text-muted-foreground font-mono text-sm">
                {formatBytes(row.original.size)}
            </div>
        ),
    },
    {
        accessorKey: 'serviceName',
        header: t('table.service'),
        cell: ({ row }) => (
            <div className="text-muted-foreground max-w-40 truncate text-sm">
                {row.original.serviceName || '-'}
            </div>
        ),
    },
];
