'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ReassociateGitAccountForm } from './ReassociateGitAccountForm';

interface ReassociateGitAccountDialogProps {
    repositoryId: string;
    open: boolean;
}

export function ReassociateGitAccountDialog({
    repositoryId,
    open,
}: ReassociateGitAccountDialogProps) {
    const t = useTranslations('repository.reassociateGitAccount');
    const { openDialog } = useConfirmationDialogStore();

    useEffect(() => {
        if (!open) return;

        openDialog({
            title: (
                <span className="flex items-center gap-2">
                    <TriangleAlert className="text-destructive size-4 shrink-0" />
                    {t('title')}
                </span>
            ),
            props: {
                showCloseButton: false,
            },
            description: t('description'),
            content: <ReassociateGitAccountForm repositoryId={repositoryId} />,
            closeOnBackground: false,
        });
    }, [open, repositoryId]);

    return null;
}
