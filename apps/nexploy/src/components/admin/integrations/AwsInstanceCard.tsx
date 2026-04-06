'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { deleteAwsAccountAction } from '@/actions/aws/deleteAccount.action';

interface AwsInstanceCardProps {
    id: string;
    displayName: string;
    region: string;
    maskedAccessKeyId: string;
}

export function AwsInstanceCard({ id, displayName, region, maskedAccessKeyId }: AwsInstanceCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('integrations.aws');
    const tNotifications = useTranslations('notifications');

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            const result = await deleteAwsAccountAction({ id });
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
                        <StatusLabel>{t('configured')} — {region}</StatusLabel>
                    </Status>
                </div>
                <p className="text-muted-foreground text-sm">Access Key ID: {maskedAccessKeyId}</p>
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
