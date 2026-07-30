'use client';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown, MoreHorizontal, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import type { TranslationFunction } from '@workspace/typescript-interface/commun';

export interface SSLCertRow {
    id: string;
    name: string;
    domain: string;
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    expiresAt: Date | null;
    createdAt: Date;
}

interface ColumnsOptions {
    onDelete: (cert: SSLCertRow) => void;
}

export const getColumnsSSL = (
    tSsl: TranslationFunction,
    options: ColumnsOptions,
): ColumnDef<SSLCertRow>[] => {
    const { onDelete } = options;

    return [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {tSsl('colName')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const cert = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{cert.name}</span>
                        <span className="text-muted-foreground font-mono text-xs">
                            {cert.domain}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: tSsl('colProvider'),
            cell: ({ row }) => {
                const type = row.original.type;
                if (type === 'LETS_ENCRYPT') {
                    return (
                        <Badge
                            variant="outline"
                            className="border-green-500/50 bg-green-500/10 text-green-600"
                        >
                            <RefreshCw className="mr-1 size-3" />
                            {tSsl('letsEncrypt')}
                        </Badge>
                    );
                }
                return (
                    <Badge
                        variant="outline"
                        className="border-blue-500/50 bg-blue-500/10 text-blue-600"
                    >
                        <ShieldCheck className="mr-1 size-3" />
                        Custom
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'expiresAt',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {tSsl('colExpires')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const expiresAt = row.original.expiresAt;
                if (!expiresAt) {
                    return (
                        <span className="text-muted-foreground text-sm">{tSsl('autoRenew')}</span>
                    );
                }
                const now = new Date();
                const daysLeft = Math.ceil(
                    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );
                const isExpired = daysLeft <= 0;
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
                return (
                    <span
                        className={
                            isExpired
                                ? 'text-destructive text-sm font-medium'
                                : isExpiringSoon
                                  ? 'text-sm font-medium text-orange-500'
                                  : 'text-muted-foreground text-sm'
                        }
                    >
                        {isExpired ? tSsl('expired') : dayjs(expiresAt).format('DD/MM/YYYY')}
                    </span>
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
                    {tSsl('created').replace(':', '')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {dayjs(row.original.createdAt).format('DD/MM/YYYY')}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const cert = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                variant={'destructive'}
                                onClick={() => onDelete(cert)}
                            >
                                <Trash2 />
                                {tSsl('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
};
