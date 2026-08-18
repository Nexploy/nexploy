'use client';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown, Asterisk, MoreHorizontal, Pencil, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
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
    coveredDomains: string[];
    type: 'LETS_ENCRYPT' | 'CUSTOM';
    expiresAt: Date | null;
    createdAt: Date;
}

interface ColumnsOptions {
    onEdit: (cert: SSLCertRow) => void;
    onDelete: (cert: SSLCertRow) => void;
}

export function resolveCoveredDomains(cert: Pick<SSLCertRow, 'domain' | 'coveredDomains'>): string[] {
    return cert.coveredDomains.length > 0 ? cert.coveredDomains : [cert.domain].filter(Boolean);
}

export function isWildcardDomain(domain: string): boolean {
    return domain.startsWith('*.');
}

export const getColumnsSSL = (tSsl: TranslationFunction, options: ColumnsOptions): ColumnDef<SSLCertRow>[] => {
    const { onEdit, onDelete } = options;

    return [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    {tSsl('colName')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const cert = row.original;
                const coveredDomains = resolveCoveredDomains(cert);
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">{cert.name}</span>
                        <span className="font-mono text-muted-foreground text-xs">{cert.domain}</span>
                        {coveredDomains.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-muted-foreground text-xs">{tSsl('covers')}</span>
                                {coveredDomains.map((coveredDomain) =>
                                    isWildcardDomain(coveredDomain) ? (
                                        <Badge
                                            key={coveredDomain}
                                            variant="outline"
                                            title={tSsl('wildcardHint')}
                                            className="border-amber-500/50 bg-amber-500/10 font-mono text-[11px] text-amber-600"
                                        >
                                            <Asterisk className="mr-0.5 size-3" />
                                            {coveredDomain}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            key={coveredDomain}
                                            variant="secondary"
                                            className="font-mono text-[11px]"
                                        >
                                            {coveredDomain}
                                        </Badge>
                                    ),
                                )}
                            </div>
                        )}
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
                        <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-600">
                            <RefreshCw className="mr-1 size-3" />
                            {tSsl('letsEncrypt')}
                        </Badge>
                    );
                }
                return (
                    <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-600">
                        <ShieldCheck className="mr-1 size-3" />
                        Custom
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'expiresAt',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    {tSsl('colExpires')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const expiresAt = row.original.expiresAt;
                if (!expiresAt) {
                    return <span className="text-muted-foreground text-sm">{tSsl('autoRenew')}</span>;
                }
                const now = new Date();
                const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft <= 0;
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
                return (
                    <span
                        className={
                            isExpired
                                ? 'font-medium text-destructive text-sm'
                                : isExpiringSoon
                                  ? 'font-medium text-orange-500 text-sm'
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
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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
            size: 50,
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
                            {cert.type === 'CUSTOM' && (
                                <DropdownMenuItem onClick={() => onEdit(cert)}>
                                    <Pencil />
                                    {tSsl('edit')}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem variant={'destructive'} onClick={() => onDelete(cert)}>
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
