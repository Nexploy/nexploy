'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { deleteBucketStorageAccountAction } from '@/actions/bucket-storage/deleteAccount.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';

interface BucketStorageInstanceCardProps {
    id: string;
    displayName: string;
    region: string;
    endpoint: string | null;
    maskedAccessKeyId: string;
}

export function BucketStorageInstanceCard({
    id,
    displayName,
    region,
    endpoint,
    maskedAccessKeyId,
}: BucketStorageInstanceCardProps) {
    const router = useRouter();
    const t = useTranslations('integrations.bucketStorage');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { executeAsync, isPending } = useAction(deleteBucketStorageAccountAction, {
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
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    <Status status={statusMap['connected'].status}>
                        <StatusIndicator />
                        <StatusLabel>
                            {t('configured')} — {endpoint ? new URL(endpoint).host : 'AWS S3'} ·{' '}
                            {region}
                        </StatusLabel>
                    </Status>
                </div>
                <p className="text-muted-foreground text-sm">Access Key ID: {maskedAccessKeyId}</p>
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
