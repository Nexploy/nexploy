'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { ArrowUpDown, Cloud, Globe, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';
import { useContainersStore } from '@/stores/docker/useContainersStore.ts';

interface ColumnsOptions {
    onEdit: (domain: Domain) => void;
    onDelete: (domain: Domain) => void;
}

export const getColumnsDomains = (
    t: TranslationFunction,
    options: ColumnsOptions,
): ColumnDef<Domain>[] => {
    const { onEdit, onDelete } = options;

    return [
        {
            accessorKey: 'host',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.host')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const domain = row.original;
                const url = `${domain.https ? 'https://' : 'http://'}${domain.host}${
                    domain.path !== '/' ? domain.path : ''
                }`;

                return (
                    <div className="flex min-w-0 items-center gap-2">
                        {domain.cloudflareDnsRecordId ? (
                            <Cloud className="size-4 shrink-0 text-orange-500" />
                        ) : domain.https ? (
                            <Lock className="size-4 shrink-0 text-green-500" />
                        ) : (
                            <Globe className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <Link
                            href={url}
                            className="truncate font-mono text-sm font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {url}
                        </Link>
                    </div>
                );
            },
        },
        {
            accessorKey: 'containerName',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.container')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const container = useContainersStore((state) =>
                    state.getContainerByName(row.original.containerName),
                );

                if (row.original.containerName) {
                    return (
                        <Link
                            href={`/docker/containers/${container?.id}`}
                            className="flex hover:underline"
                        >
                            <span>{row.original.containerName}</span>
                        </Link>
                    );
                }
                return <span className="text-muted-foreground text-sm">-</span>;
            },
        },
        {
            accessorKey: 'containerPort',
            header: t('table.port'),
            cell: ({ row }) => (
                <span className="text-muted-foreground font-mono text-sm">
                    :{row.original.containerPort}
                </span>
            ),
        },
        {
            accessorKey: 'https',
            header: t('table.protocol'),
            cell: ({ row }) => (
                <Badge variant={row.original.https ? 'default' : 'outline'}>
                    {row.original.https ? 'HTTPS' : 'HTTP'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('table.actions')}</span>,
            cell: ({ row }) => {
                const domain = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(domain)}>
                                    <Pencil />
                                    {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => onDelete(domain)}
                                >
                                    <Trash2 />
                                    {t('remove')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
};
