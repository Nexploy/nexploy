'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Clock, Copy, Shield, ShieldOff, X } from 'lucide-react';
import { revokeInvitation } from '@/actions/auth/users.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface Invitation {
    id: string;
    email: string;
    role: string | null;
    expiresAt: Date;
    createdAt: Date;
}

interface InvitationsTableProps {
    invitations: Invitation[];
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { execute: executeRevoke, isPending: isRevoking } = useAction(revokeInvitation, {
        onSuccess: () => toast.success('Invitation revoked'),
        onError: ({ error }) => toast.error(error.serverError || 'Failed to revoke invitation'),
    });

    const handleCopyLink = (invitation: Invitation) => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/signup?invitation=${invitation.id}&email=${encodeURIComponent(invitation.email)}`;
        navigator.clipboard.writeText(link);
        toast.success('Invitation link copied to clipboard');
    };

    const handleRevoke = (invitation: Invitation) => {
        openAlertDialog({
            title: 'Revoke Invitation',
            description: `Are you sure you want to revoke the invitation for ${invitation.email}?`,
            cancelLabel: 'Cancel',
            actionLabel: 'Revoke',
            onAction: async () => {
                await executeRevoke({ invitationId: invitation.id });
            },
        });
    };

    const getTimeRemaining = (expiresAt: Date) => {
        const now = new Date();
        const diff = new Date(expiresAt).getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires in</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                            <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                                {invitation.role === 'admin' ? (
                                    <Shield className="mr-1 size-3" />
                                ) : (
                                    <ShieldOff className="mr-1 size-3" />
                                )}
                                {invitation.role || 'user'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" />
                                {getTimeRemaining(invitation.expiresAt)}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {new Date(invitation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopyLink(invitation)}
                                    title="Copy invitation link"
                                >
                                    <Copy className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevoke(invitation)}
                                    disabled={isRevoking}
                                    title="Revoke invitation"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
