'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Cloud, Plus, X } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { toast } from 'sonner';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CloudflareConnectForm } from '@/components/cloudflare/CloudflareConnectForm';
import { useTranslations } from 'next-intl';

interface CloudflareIntegrationCardProps {
    isConnected: boolean;
}

export function CloudflareIntegrationCard({ isConnected }: CloudflareIntegrationCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('integrations');
    const tNotifications = useTranslations('notifications');

    const { openDialog } = useConfirmationDialogStore();

    const handleOpenDialog = () => {
        openDialog({
            closeOnBackground: true,
            title: t('cloudflare.connectTitle'),
            description: t('cloudflare.connectDescription'),
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <CloudflareConnectForm />,
        });
    };

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            const result = await disconnectCloudflareAction();
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('cloudflare.disconnectedSuccess'));
                router.refresh();
            }
        } catch {
            toast.error(tNotifications('operationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                    <Cloud className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{t('cloudflare.title')}</span>
                        <Status
                            status={statusMap[isConnected ? 'connected' : 'disconnected'].status}
                        >
                            <StatusIndicator />
                            <StatusLabel>
                                {isConnected ? t('connected') : t('notConnected')}
                            </StatusLabel>
                        </Status>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('cloudflare.description')}
                    </p>
                </div>
            </div>

            {isConnected ? (
                <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    icon={X}
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    {t('disconnect')}
                </Button>
            ) : (
                <Button icon={Plus} onClick={handleOpenDialog}>
                    {t('connect')}
                </Button>
            )}
        </div>
    );
}
