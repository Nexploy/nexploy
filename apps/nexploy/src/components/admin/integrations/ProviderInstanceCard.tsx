'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { deleteGitProviderAction } from '@/actions/admin/oauthProvider.action';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const tOAuth = useTranslations('integrations.oauth');
    const tNotifications = useTranslations('notifications');

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            const result = await deleteGitProviderAction({ id });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(tOAuth('deleteSuccess'));
                router.refresh();
            }
        } catch {
            toast.error(tNotifications('operationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const statusText = appName ? `${tOAuth('configured')} — ${appName}` : tOAuth('configured');

    return (
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    <Status status={statusMap['connected'].status}>
                        <StatusIndicator />
                        <StatusLabel>{statusText}</StatusLabel>
                    </Status>
                </div>
                {maskedClientId && (
                    <p className="text-muted-foreground text-sm">Client ID: {maskedClientId}</p>
                )}
            </div>

            <Button
                variant="destructiveOutline"
                size="icon"
                onClick={handleRemove}
                icon={Trash2}
                disabled={isLoading}
                isLoading={isLoading}
            />
        </div>
    );
}
