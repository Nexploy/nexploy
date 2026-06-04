'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { deleteGitProviderAction } from '@/actions/git/deleteGitProvider.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';

interface ProviderInstanceCardProps {
    id: string;
    displayName: string;
    appName?: string;
    maskedClientId?: string;
}

export function ProviderInstanceCard({
    id,
    displayName,
    appName,
    maskedClientId,
}: ProviderInstanceCardProps) {
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const tOAuth = useTranslations('integrations.oauth');
    const tCommon = useTranslations('common');

    const { executeAsync, isPending } = useAction(deleteGitProviderAction, {
        onSuccess: () => {
            toast.success(tOAuth('deleteSuccess'));
            router.refresh();
        },
    });

    const handleRemoveClick = () => {
        openAlertDialog({
            title: tOAuth('deleteConfirmTitle'),
            description: tOAuth('deleteConfirmDescription', { name: displayName }),
            cancelLabel: tCommon('cancel'),
            actionLabel: tOAuth('deleteConfirmAction'),
            onAction: () => executeAsync({ id }),
        });
    };

    const statusText = appName ? `${tOAuth('configured')} — ${appName}` : tOAuth('configured');

    return (
        <div className="bg-card flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span>{displayName}</span>
                    <Status status={statusMap['connected'].status}>
                        <StatusIndicator />
                        <StatusLabel>{statusText}</StatusLabel>
                    </Status>
                </div>
                {maskedClientId && (
                    <p className="text-muted-foreground text-xs">Client ID: {maskedClientId}</p>
                )}
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
