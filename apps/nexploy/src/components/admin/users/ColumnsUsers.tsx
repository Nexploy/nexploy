'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
    ArrowUpDown,
    Ban,
    CheckCircle,
    Lock,
    MoreHorizontal,
    Shield,
    ShieldOff,
    Trash2,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

export interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
    image: string | null;
}

type TranslationFunction = (key: string, values?: Record<string, string | number>) => string;

interface ColumnsOptions {
    currentUserId?: string;
    isAdmin?: boolean;
    isUpdatingRole: boolean;
    isDeleting: boolean;
    isBanning: boolean;
    onRoleChange: (userId: string, role: 'admin' | 'user') => void;
    onDelete: (user: UserRow) => void;
    onBan: (user: UserRow) => void;
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const isSystemUser = (user: UserRow) => {
    return user.role === 'system';
};

export const getColumnsUsers = (
    t: TranslationFunction,
    options: ColumnsOptions,
): ColumnDef<UserRow>[] => {
    const {
        currentUserId,
        isAdmin,
        isUpdatingRole,
        isDeleting,
        isBanning,
        onRoleChange,
        onDelete,
        onBan,
    } = options;

    const columns: ColumnDef<UserRow>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('user')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.id === currentUserId;
                const isSystem = isSystemUser(user);

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{user.name}</span>
                                {isSystem && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Lock className="text-muted-foreground size-3.5" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('systemUserProtected')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            {isCurrentUser && (
                                <span className="text-muted-foreground text-xs">{t('you')}</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('email')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
        },
        {
            accessorKey: 'role',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('role')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.id === currentUserId;
                const isSystem = isSystemUser(user);
                const canEditRole = isAdmin && !isCurrentUser && !isSystem;

                if (isSystem) {
                    return (
                        <Badge
                            variant="outline"
                            className="border-amber-500/50 bg-amber-500/10 text-amber-600"
                        >
                            <Lock className="mr-1 size-3" />
                            {t('systemRole')}
                        </Badge>
                    );
                }

                if (canEditRole) {
                    return (
                        <Select
                            value={user.role || 'user'}
                            onValueChange={(value: 'admin' | 'user') =>
                                onRoleChange(user.id, value)
                            }
                            disabled={isUpdatingRole}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Shield className="size-3" />
                                        {t('adminRole')}
                                    </div>
                                </SelectItem>
                                <SelectItem value="user">
                                    <div className="flex items-center gap-2">
                                        <ShieldOff className="size-3" />
                                        {t('userRole')}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    );
                }

                return (
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? (
                            <Shield className="mr-1 size-3" />
                        ) : (
                            <ShieldOff className="mr-1 size-3" />
                        )}
                        {user.role === 'admin' ? t('adminRole') : t('userRole')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'banned',
            header: t('status'),
            cell: ({ row }) => {
                const user = row.original;
                const isSystem = isSystemUser(user);

                if (isSystem) {
                    return (
                        <Badge
                            variant="outline"
                            className="border-amber-500/50 bg-amber-500/10 text-amber-600"
                        >
                            <Lock className="mr-1 size-3" />
                            {t('protected')}
                        </Badge>
                    );
                }

                if (user.banned) {
                    return (
                        <Badge variant="destructive">
                            <Ban className="mr-1 size-3" />
                            {t('banned')}
                        </Badge>
                    );
                }

                return (
                    <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="mr-1 size-3" />
                        {t('active')}
                    </Badge>
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
                    {t('createdAt')}
                    <ArrowUpDown className="ml-2 size-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    if (isAdmin) {
        columns.push({
            id: 'actions',
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.id === currentUserId;
                const isSystem = isSystemUser(user);

                if (isCurrentUser || isSystem) {
                    return null;
                }

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onBan(user)} disabled={isBanning}>
                                <Ban className="mr-2 size-4" />
                                {user.banned ? t('unbanUser') : t('banUser')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(user)}
                                disabled={isDeleting}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                {t('deleteUser')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        });
    }

    return columns;
};
