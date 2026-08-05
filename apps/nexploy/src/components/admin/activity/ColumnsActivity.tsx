'use client';

import { Column, ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import { ActivityStatusBadge } from '@/components/admin/activity/ActivityStatusBadge';

export function getActivityActorLabel(entry: ActivityLogEntry, t: TranslationFunction): string {
    return entry.actorName ?? entry.actorEmail ?? t(`actorType.${entry.actorType}`);
}

export function getColumnsActivity(t: TranslationFunction): ColumnDef<ActivityLogEntry>[] {
    const sortableHeader =
        (label: string) =>
        ({ column }: { column: Column<ActivityLogEntry, unknown> }) => (
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
            id: 'date',
            accessorFn: (entry) => dayjs(entry.createdAt).valueOf(),
            header: sortableHeader(t('columns.date')),
            cell: ({ row }) => (
                <span className="text-muted-foreground font-mono text-sm whitespace-nowrap">
                    {dayjs(row.original.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                </span>
            ),
        },
        {
            id: 'action',
            accessorFn: (entry) => entry.name,
            header: sortableHeader(t('columns.action')),
            cell: ({ row }) => <span className="block max-w-60 truncate text-sm font-medium">{row.original.name}</span>,
        },
        {
            id: 'actor',
            accessorFn: (entry) => getActivityActorLabel(entry, t),
            header: sortableHeader(t('columns.actor')),
            cell: ({ row }) => (
                <span className="text-muted-foreground block max-w-48 truncate text-sm">
                    {getActivityActorLabel(row.original, t)}
                </span>
            ),
        },
        {
            id: 'target',
            accessorFn: (entry) => entry.targetName ?? entry.targetId ?? '',
            header: sortableHeader(t('columns.target')),
            cell: ({ row }) => (
                <span className="text-muted-foreground block max-w-60 truncate font-mono text-sm">
                    {row.original.targetName ?? row.original.targetId ?? '—'}
                </span>
            ),
        },
        {
            id: 'source',
            accessorFn: (entry) => entry.source,
            header: sortableHeader(t('columns.source')),
            cell: ({ row }) => (
                <Badge variant="secondary" className="whitespace-nowrap">
                    {t(`source.${row.original.source}`)}
                </Badge>
            ),
        },
        {
            id: 'status',
            accessorFn: (entry) => entry.status,
            header: sortableHeader(t('columns.status')),
            cell: ({ row }) => <ActivityStatusBadge status={row.original.status} />,
        },
        {
            id: 'duration',
            accessorFn: (entry) => entry.durationMs ?? -1,
            header: sortableHeader(t('columns.duration')),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm tabular-nums">
                    {row.original.durationMs === null ? '—' : `${row.original.durationMs} ms`}
                </span>
            ),
        },
    ];
}
