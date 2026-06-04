'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';

interface CloudflareInstanceCardProps {
    id: string;
    displayName: string;
}

export function CloudflareInstanceCard({ id, displayName }: CloudflareInstanceCardProps) {
    const router = useRouter();
    const t = useTranslations('integrations.cloudflare');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { executeAsync, isPending } = useAction(disconnectCloudflareAction, {
        onSuccess: () => {
            toast.success(t('deletedSuccess'));
            router.refresh();
        },
    });

    const handleRemoveClick = () => {
        openAlertDialog({
            title: t('deleteConfirmTitle'),
            description: t('deleteConfirmDescription', { name: displayName }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('deleteConfirmAction'),
            onAction: () => executeAsync({ id }),
        });
    };

    return (
        <div className="bg-card flex items-center justify-between rounded-lg border p-4">
            <div className="flex gap-2">
                <span>{displayName}</span>
                <Status status={statusMap['connected'].status}>
                    <StatusIndicator />
                    <StatusLabel>{t('configured')}</StatusLabel>
                </Status>
            </div>

            <Button
                variant="destructiveOutline"
                size="icon"
                onClick={handleRemoveClick}
                icon={Trash2}
                disabled={isPending}
            />
        </div>
    );
}
