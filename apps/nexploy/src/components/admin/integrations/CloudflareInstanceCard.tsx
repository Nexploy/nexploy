'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';

interface CloudflareInstanceCardProps {
    id: string;
    displayName: string;
}

export function CloudflareInstanceCard({ id, displayName }: CloudflareInstanceCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('integrations.cloudflare');
    const tNotifications = useTranslations('notifications');

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            const result = await disconnectCloudflareAction({ id });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('deletedSuccess'));
                router.refresh();
            }
        } catch {
            toast.error(tNotifications('operationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    <Status status={statusMap['connected'].status}>
                        <StatusIndicator />
                        <StatusLabel>{t('configured')}</StatusLabel>
                    </Status>
                </div>
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
