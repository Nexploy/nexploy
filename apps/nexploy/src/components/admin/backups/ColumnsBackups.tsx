'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Cloud, Download, HardDrive, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { Backup } from '@/components/admin/backups/BackupsSection';
import { formatBytes } from '@/utils/formatBytes';
import dayjs from 'dayjs';

interface ColumnOptions {
    onDelete: (backup: Backup) => void;
    onRestore: (backup: Backup) => void;
    onDownload: (backup: Backup) => void;
}

export function getColumnsBackups(
    t: (key: string) => string,
    options: ColumnOptions
): ColumnDef<Backup>[] {
    return [
        {
            accessorKey: 'name',
            header: () => t('backupName'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'volumeName',
            header: () => t('backupVolume'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <HardDrive className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">{row.original.volumeName}</span>
                </div>
            ),
        },
        {
            accessorKey: 'size',
            header: () => t('backupSize'),
            cell: ({ row }) => (
                <span className="text-muted-foreground">{formatBytes(row.original.size)}</span>
            ),
        },
        {
            accessorKey: 'storage',
            header: () => t('backupStorage'),
            cell: ({ row }) => {
                const storage = row.original.storage;
                return (
                    <Badge variant="outline" className="gap-1">
                        {storage === 's3' ? (
                            <>
                                <Cloud className="size-3" />
                                S3
                            </>
                        ) : (
                            <>
                                <HardDrive className="size-3" />
                                {t('local')}
                            </>
                        )}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'status',
            header: () => t('backupStatus'),
            cell: ({ row }) => {
                const status = row.original.status;
                const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
                    completed: 'default',
                    in_progress: 'secondary',
                    failed: 'destructive',
                };
                const labels: Record<string, string> = {
                    completed: t('backupCompleted'),
                    in_progress: t('backupInProgress'),
                    failed: t('backupFailed'),
                };
                return <Badge variant={variants[status]}>{labels[status]}</Badge>;
            },
        },
        {
            accessorKey: 'createdAt',
            header: () => t('backupDate'),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {dayjs(row.original.createdAt).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => t('actions'),
            cell: ({ row }) => {
                const backup = row.original;
                const isCompleted = backup.status === 'completed';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {backup.storage === 'local' && isCompleted && (
                                <DropdownMenuItem onClick={() => options.onDownload(backup)}>
                                    <Download className="mr-2 size-4" />
                                    {t('downloadBackup')}
                                </DropdownMenuItem>
                            )}
                            {isCompleted && (
                                <DropdownMenuItem onClick={() => options.onRestore(backup)}>
                                    <RotateCcw className="mr-2 size-4" />
                                    {t('restoreBackup')}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => options.onDelete(backup)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                {t('deleteBackup')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}
