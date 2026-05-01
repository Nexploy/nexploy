'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { deleteAwsAccountAction } from '@/actions/aws/deleteAccount.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';

interface AwsInstanceCardProps {
    id: string;
    displayName: string;
    region: string;
    maskedAccessKeyId: string;
}

export function AwsInstanceCard({
    id,
    displayName,
    region,
    maskedAccessKeyId,
}: AwsInstanceCardProps) {
    const router = useRouter();
    const t = useTranslations('integrations.aws');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { executeAsync, isPending } = useAction(deleteAwsAccountAction, {
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
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    <Status status={statusMap['connected'].status}>
                        <StatusIndicator />
                        <StatusLabel>
                            {t('configured')} — {region}
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
