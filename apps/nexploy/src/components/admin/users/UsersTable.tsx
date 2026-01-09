'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
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
import { Ban, CheckCircle, MoreHorizontal, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { banUser, deleteUser, updateUserRole } from '@/actions/auth/users.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface User {
    id: string;
    name: string;
    email: string;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
    image: string | null;
}

interface UsersTableProps {
    users: User[];
    currentUserId?: string;
    isAdmin?: boolean;
}

export function UsersTable({ users, currentUserId, isAdmin }: UsersTableProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('admin');

    const { execute: executeUpdateRole, isPending: isUpdatingRole } = useAction(updateUserRole, {
        onSuccess: () => toast.success(t('userRoleUpdated')),
        onError: ({ error }) => toast.error(error.serverError || t('userRoleUpdateFailed')),
    });

    const { execute: executeDelete, isPending: isDeleting } = useAction(deleteUser, {
        onSuccess: () => toast.success(t('userDeletedSuccess')),
        onError: ({ error }) => toast.error(error.serverError || t('userDeleteFailed')),
    });

    const { execute: executeBan, isPending: isBanning } = useAction(banUser, {
        onSuccess: ({ data }) => toast.success(data?.user.banned ? t('userBannedSuccess') : t('userUnbannedSuccess')),
        onError: ({ error }) => toast.error(error.serverError || t('userBanUpdateFailed')),
    });

    const handleRoleChange = (userId: string, role: 'admin' | 'user') => {
        executeUpdateRole({ userId, role });
    };

    const handleDelete = (user: User) => {
        openAlertDialog({
            title: t('deleteUser'),
            description: t('confirmDeleteUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: t('deleteUser'),
            onAction: async () => {
                await executeDelete({ userId: user.id });
            },
        });
    };

    const handleBan = (user: User) => {
        const isBanned = user.banned;
        openAlertDialog({
            title: isBanned ? t('unbanUser') : t('banUser'),
            description: isBanned
                ? t('confirmUnbanUser', { name: user.name })
                : t('confirmBanUser', { name: user.name }),
            cancelLabel: t('cancel'),
            actionLabel: isBanned ? t('unbanUser') : t('banUser'),
            onAction: async () => {
                await executeBan({ userId: user.id, ban: !isBanned });
            },
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => {
                    const isCurrentUser = user.id === currentUserId;
                    return (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-8">
                                        <AvatarImage src={user.image || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        {isCurrentUser && (
                                            <span className="text-muted-foreground text-xs">
                                                {t('you')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                                {isAdmin && !isCurrentUser ? (
                                    <Select
                                        value={user.role || 'user'}
                                        onValueChange={(value: 'admin' | 'user') =>
                                            handleRoleChange(user.id, value)
                                        }
                                        disabled={isUpdatingRole}
                                    >
                                        <SelectTrigger className="w-24">
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
                                ) : (
                                    <Badge
                                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                                    >
                                        {user.role === 'admin' ? (
                                            <Shield className="mr-1 size-3" />
                                        ) : (
                                            <ShieldOff className="mr-1 size-3" />
                                        )}
                                        {user.role === 'admin' ? t('adminRole') : t('userRole')}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {user.banned ? (
                                    <Badge variant="destructive">
                                        <Ban className="mr-1 size-3" />
                                        {t('banned')}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-green-600">
                                        <CheckCircle className="mr-1 size-3" />
                                        {t('active')}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            {isAdmin && (
                                <TableCell>
                                    {!isCurrentUser && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleBan(user)}
                                                    disabled={isBanning}
                                                >
                                                    <Ban className="mr-2 size-4" />
                                                    {user.banned ? t('unbanUser') : t('banUser')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(user)}
                                                    disabled={isDeleting}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 size-4" />
                                                    {t('deleteUser')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    );
                })}
                {users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center">
                            {t('noUsers')}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
