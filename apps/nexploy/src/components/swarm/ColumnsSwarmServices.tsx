'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { ServiceDropdownActions } from './ServiceDropdownActions';
import Link from 'next/link';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';

function getReplicaBadgeVariant(
    running: number,
    desired: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (desired === 0) return 'secondary';
    if (running === desired) return 'default';
    if (running === 0) return 'destructive';
    return 'secondary';
}

function formatImage(image: string): string {
    const parts = image.split('/');
    const nameTag = parts[parts.length - 1];
    if (nameTag && nameTag.length > 40) {
        return nameTag.slice(0, 37) + '...';
    }
    return nameTag || image;
}

export function getColumnsSwarmServices(
    t: TranslationFunction,
    getRunningTasksCount: (serviceId: string) => number,
): ColumnDef<SwarmService>[] {
    return [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('service')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => (
                <Link href={`/swarm/services/${row.original.id}`} className="flex hover:underline">
                    <span className="truncate">{row.original.name}</span>
                </Link>
            ),
        },
        {
            accessorKey: 'image',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('image')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge variant="secondary" className="max-w-full justify-start font-mono">
                    <span className="truncate">{formatImage(row.original.image)}</span>
                </Badge>
            ),
        },
        {
            accessorKey: 'mode',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('mode')}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="max-w-full justify-start text-xs capitalize">
                    <span className={'truncate'}>{row.original.mode}</span>
                </Badge>
            ),
        },
        {
            id: 'replicas',
            header: t('replicas'),
            cell: ({ row }) => {
                const runningTasks = getRunningTasksCount(row.original.id);
                if (row.original.mode === 'replicated') {
                    return (
                        <Badge
                            className={'max-w-full justify-start'}
                            variant={getReplicaBadgeVariant(runningTasks, row.original.replicas)}
                        >
                            <span className={'truncate'}>
                                {t('tasksRunning', {
                                    running: runningTasks,
                                    total: row.original.replicas,
                                })}
                            </span>
                        </Badge>
                    );
                }
                return <Badge variant="outline">{t('global')}</Badge>;
            },
        },
        {
            id: 'ports',
            enableSorting: false,
            header: t('ports'),
            cell: ({ row }) => {
                const { ports } = row.original;
                if (!ports.length) {
                    return (
                        <span className="text-muted-foreground text-xs">{t('noPortsExposed')}</span>
                    );
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {ports.slice(0, 3).map((port, i) => (
                            <Badge
                                key={i}
                                variant="secondary"
                                className={'max-w-full justify-start'}
                            >
                                <span className={'truncate'}>
                                    {port.publishedPort} → {port.targetPort}/{port.protocol}
                                </span>
                            </Badge>
                        ))}
                        {ports.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{ports.length - 3}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'updateStatus',
            header: t('updateStatus'),
            cell: ({ row }) => {
                const { updateStatus } = row.original;
                if (!updateStatus) {
                    return <span className="text-muted-foreground text-xs">—</span>;
                }
                return (
                    <Badge
                        variant={
                            updateStatus.state === 'completed'
                                ? 'default'
                                : updateStatus.state === 'updating'
                                  ? 'secondary'
                                  : 'destructive'
                        }
                        className="text-xs capitalize"
                    >
                        {updateStatus.state}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            size: 100,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <ServiceDropdownActions service={row.original} />
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}
