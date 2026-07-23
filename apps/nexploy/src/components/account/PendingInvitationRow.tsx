'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Check, X } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { acceptInvitationAction } from '@/actions/organization/acceptInvitation.action';
import { rejectInvitationAction } from '@/actions/organization/rejectInvitation.action';

interface PendingInvitationRowProps {
    invitationId: string;
    organizationName: string;
    role: string;
}

export function PendingInvitationRow({
    invitationId,
    organizationName,
    role,
}: PendingInvitationRowProps) {
    const t = useTranslations('organization');
    const router = useRouter();

    const { execute: executeAccept, isPending: isAccepting } = useAction(acceptInvitationAction, {
        onSuccess: () => {
            toast.success(t('success.accepted'));
            router.refresh();
        },
        onError: ({ error }) => toast.error(error.serverError || t('errors.acceptFailed')),
    });

    const { execute: executeReject, isPending: isRejecting } = useAction(rejectInvitationAction, {
        onSuccess: () => {
            toast.success(t('success.rejected'));
            router.refresh();
        },
        onError: ({ error }) => toast.error(error.serverError || t('errors.rejectFailed')),
    });

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex flex-col">
                <span className="font-medium">{organizationName}</span>
                <Badge variant="outline" className="mt-1 w-fit">
                    {t(`roles.${role}`)}
                </Badge>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isAccepting || isRejecting}
                    onClick={() => executeReject({ invitationId })}
                >
                    <X className="size-4" />
                    {t('invitations.reject')}
                </Button>
                <Button
                    size="sm"
                    disabled={isAccepting || isRejecting}
                    onClick={() => executeAccept({ invitationId })}
                >
                    <Check className="size-4" />
                    {t('invitations.accept')}
                </Button>
            </div>
        </div>
    );
}
