'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { ReassociateGitAccountForm } from '@/components/repositories/reassociateGitAccount/ReassociateGitAccountForm';
import { BackButton } from '@/components/shared/BackButton';

interface ReassociateGitAccountDialogProps {
    repositoryId: string;
    repositoryName: string;
    open: boolean;
}

export function ReassociateGitAccountDialog({
    repositoryId,
    repositoryName,
    open,
}: ReassociateGitAccountDialogProps) {
    const t = useTranslations('repository.reassociateGitAccount');
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                showCloseButton={false}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="px-6 pt-6">
                    <BackButton size="sm" className="w-fit" />
                </div>
                <DialogHeader className="pt-0">
                    <DialogTitle className="flex items-center gap-2">
                        <TriangleAlert className="text-destructive size-4 shrink-0" />
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>
                <ReassociateGitAccountForm
                    repositoryId={repositoryId}
                    repositoryName={repositoryName}
                    onClose={() => setIsOpen(false)}
                    onReopen={() => setIsOpen(true)}
                />
            </DialogContent>
        </Dialog>
    );
}
