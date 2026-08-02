'use client';

import { Column, ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import type { DockerEventData } from '@workspace/typescript-interface/docker/docker.events';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import { getEventDisplayName } from '@/stores/docker/useEventsStore';

const getActionVariant = (action: string) => {
    switch (action) {
        case 'start':
        case 'create':
        case 'pull':
        case 'load':
        case 'import':
        case 'connect':
            return 'default' as const;
        case 'stop':
        case 'pause':
        case 'disconnect':
            return 'secondary' as const;
        case 'destroy':
        case 'delete':
        case 'die':
        case 'kill':
        case 'remove':
            return 'destructive' as const;
        case 'restart':
        case 'unpause':
        case 'update':
        case 'rename':
            return 'outline' as const;
        default:
            return 'secondary' as const;
    }
};

const getTypeVariant = (type: string) => {
    switch (type) {
        case 'container':
            return 'default' as const;
        case 'image':
            return 'secondary' as const;
        case 'network':
        case 'volume':
            return 'outline' as const;
        default:
            return 'secondary' as const;
    }
};

export const getEventTimestamp = (event: DockerEventData) => event.time * 1000 || event.timeNano / 1000000;

export function getColumnsDockerEvents(t: TranslationFunction): ColumnDef<DockerEventData>[] {
    const sortableHeader =
        (label: string) =>
        ({ column }: { column: Column<DockerEventData, unknown> }) => (
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                {label}
                <ArrowUpDown />
            </Button>
        );

    return [
        {
            id: 'timestamp',
            accessorFn: getEventTimestamp,
            header: sortableHeader(t('timestamp')),
            cell: ({ row }) => (
                <span className="text-muted-foreground font-mono text-sm">
                    {dayjs(getEventTimestamp(row.original)).format('DD/MM/YYYY HH:mm:ss')}
                </span>
            ),
        },
        {
            id: 'type',
            accessorFn: (event) => event.Type,
            header: sortableHeader(t('type')),
            cell: ({ row }) => <Badge variant={getTypeVariant(row.original.Type)}>{row.original.Type}</Badge>,
        },
        {
            id: 'action',
            accessorFn: (event) => event.Action,
            header: sortableHeader(t('action')),
            cell: ({ row }) => (
                <Badge variant={getActionVariant(row.original.Action)}>
                    <span className="max-w-80 truncate">{row.original.Action}</span>
                </Badge>
            ),
        },
        {
            id: 'name',
            accessorFn: getEventDisplayName,
            header: sortableHeader(t('nameId')),
            cell: ({ row }) => (
                <span className="block max-w-60 truncate font-mono text-sm font-medium">
                    {getEventDisplayName(row.original)}
                </span>
            ),
        },
    ];
}
