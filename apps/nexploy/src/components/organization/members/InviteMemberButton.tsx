'use client';

import { Button } from '@workspace/ui/components/button';
import { UserPlus } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { InviteMemberForm } from '@/components/organization/members/InviteMemberForm';
import { useTranslations } from 'next-intl';

interface InviteMemberButtonProps {
    organizationId: string;
}

export function InviteMemberButton({ organizationId }: InviteMemberButtonProps) {
    const { openDialog } = useConfirmationDialogStore();
    const t = useTranslations('organization');

    const handleInvite = () => {
        openDialog({
            title: t('members.invite'),
            description: t('members.inviteDescription'),
            content: <InviteMemberForm organizationId={organizationId} />,
        });
    };

    return (
        <Button onClick={handleInvite}>
            <UserPlus />
            {t('members.invite')}
        </Button>
    );
}
