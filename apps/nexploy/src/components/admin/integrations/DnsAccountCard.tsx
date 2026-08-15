'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { disconnectDnsAction } from '@/actions/dns/disconnect.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';
import { Badge } from '@workspace/ui/components/badge';
import { dnsProviderDescriptors } from '@workspace/schemas-zod/dns/dns.schema';
import type { DnsProviderId } from '@workspace/typescript-interface/dns/dns';

interface DnsAccountCardProps {
    id: string;
    displayName: string;
    provider: DnsProviderId;
}

export function DnsAccountCard({ id, displayName, provider }: DnsAccountCardProps) {
    const router = useRouter();
    const t = useTranslations('integrations.dns');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { executeAsync, isPending } = useAction(disconnectDnsAction, {
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
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
                <span>{displayName}</span>
                <Badge variant="secondary" className="text-xs">
                    {t(`providers.${provider}.name`)}
                </Badge>
                {dnsProviderDescriptors[provider].experimental && (
                    <Badge variant="warning" className="text-xs">
                        {t('experimental')}
                    </Badge>
                )}
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
